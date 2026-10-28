"""Single-server CMS. Content and media are swapped together on restore.

Run exactly one WSGI worker (with threads); background jobs are process-local.
The scheduler talks to this process over the private Compose network.
"""
import calendar
import hashlib
import hmac
import json
import logging
import os
from pathlib import Path, PurePosixPath
import secrets
import shutil
import sqlite3
import threading
import time
import uuid
import zipfile
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from functools import wraps

import bleach
from flask import Flask, abort, jsonify, request, send_file, session
from werkzeug.exceptions import HTTPException
from werkzeug.security import check_password_hash, generate_password_hash

LOG = logging.getLogger(__name__)
COLLECTIONS = ('announcements', 'news', 'teachers', 'cases', 'education',
               'disciplines', 'schedules', 'documents', 'pages', 'courses')
TAGS = {'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'ul', 'ol', 'li', 'a',
        'h1', 'h2', 'h3', 'h4', 'blockquote', 'img', 'div', 'span', 'table',
        'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'figure', 'figcaption'}
ATTRS = {'a': ['href', 'title', 'target', 'rel'], 'img': ['src', 'alt', 'width', 'height'],
         '*': ['class'], 'td': ['colspan', 'rowspan'], 'th': ['colspan', 'rowspan']}
URL_KEYS = {'href', 'link', 'file', 'photo', 'image', 'imgSrc', 'url'}
IMAGE_EXT = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'}
INLINE_EXT = IMAGE_EXT | {'.mp4', '.webm', '.mp3', '.ogg', '.wav'}


def clean(value, key=''):
    if isinstance(value, dict):
        return {k: clean(v, k) for k, v in value.items()}
    if isinstance(value, list):
        return [clean(v, key) for v in value]
    if isinstance(value, str):
        if key in URL_KEYS or key == 'images':
            if value and not value.startswith(('/', 'https://', 'http://', 'mailto:', 'tel:', '#')):
                raise ValueError('Недопустимый адрес файла или ссылки')
            if value.startswith('//'):
                raise ValueError('Используйте полный HTTPS-адрес')
        if key in ('description', 'content', 'body'):
            return bleach.clean(value, tags=TAGS, attributes=ATTRS,
                                protocols={'http', 'https', 'mailto', 'tel'}, strip=True)
    return value


def digest(path):
    result = hashlib.sha256()
    with open(path, 'rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            result.update(chunk)
    return result.hexdigest()


def two_months_before(stamp):
    month = stamp.month - 2
    year = stamp.year
    if month < 1:
        year, month = year - 1, month + 12
    return stamp.replace(year=year, month=month,
                         day=min(stamp.day, calendar.monthrange(year, month)[1]))


class Store:
    collection_names = COLLECTIONS
    def __init__(self, root, seed):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)
        self.generations = self.root / 'generations'
        self.generations.mkdir(exist_ok=True)
        self.backups = self.root / 'backups'
        self.backups.mkdir(exist_ok=True)
        self.tmp = self.root / 'tmp'
        self.tmp.mkdir(exist_ok=True)
        self.lock = threading.RLock()
        self.jobs = {}
        self.pool = ThreadPoolExecutor(max_workers=1)
        self.busy = False
        self.last_error = None
        if not (self.root / 'current').exists():
            generation = self.generations / uuid.uuid4().hex
            generation.mkdir()
            (generation / 'uploads').mkdir()
            with sqlite3.connect(generation / 'content.sqlite3') as db:
                db.execute('CREATE TABLE content (name TEXT PRIMARY KEY, body TEXT NOT NULL, revision INTEGER NOT NULL)')
                db.execute('CREATE TABLE media (id TEXT PRIMARY KEY, name TEXT NOT NULL, size INTEGER NOT NULL, sha256 TEXT NOT NULL)')
                # Bundle legacy pictures into the same media store, so a full
                # backup also contains the images embedded in historic pages.
                legacy = Path(__file__).with_name('legacy')
                if not legacy.exists():
                    legacy = Path(__file__).parent.parent / 'public' / 'legacy'
                replacements = {}
                if legacy.exists():
                    for picture in legacy.rglob('*'):
                        if not picture.is_file():
                            continue
                        checksum = digest(picture)
                        file_id = checksum + picture.suffix.lower()
                        shutil.copyfile(picture, generation / 'uploads' / file_id)
                        db.execute('INSERT OR IGNORE INTO media VALUES (?, ?, ?, ?)',
                                   (file_id, picture.name, picture.stat().st_size, checksum))
                        replacements['/legacy/' + picture.relative_to(legacy).as_posix()] = '/uploads/' + file_id
                seed_text = json.dumps(seed, ensure_ascii=False)
                for old, new in replacements.items():
                    seed_text = seed_text.replace(old, new)
                seed = json.loads(seed_text)
                for name in COLLECTIONS:
                    db.execute('INSERT INTO content VALUES (?, ?, 1)',
                               (name, json.dumps(clean(seed.get(name, [])), ensure_ascii=False)))
                db.execute('PRAGMA user_version=1')
            self.activate(generation)
        # Interrupted jobs never replace the live generation. Uncommitted staging
        # data can be safely removed after a process restart.
        for path in self.tmp.iterdir():
            if path.is_dir():
                shutil.rmtree(path)
            else:
                path.unlink()
        self.cleanup_generations()

    @property
    def current(self):
        return (self.root / 'current').resolve()

    def connect(self):
        db = sqlite3.connect(self.current / 'content.sqlite3', timeout=30)
        db.row_factory = sqlite3.Row
        return db

    def activate(self, generation):
        pointer = self.root / 'next'
        pointer.unlink(missing_ok=True)
        pointer.symlink_to(generation.relative_to(self.root), target_is_directory=True)
        os.replace(pointer, self.root / 'current')

    def cleanup_generations(self):
        for path in self.generations.iterdir():
            if path.resolve() != self.current:
                shutil.rmtree(path)

    def get(self, name):
        with self.lock, self.connect() as db:
            row = db.execute('SELECT body, revision FROM content WHERE name=?', (name,)).fetchone()
            if row is None:
                raise ValueError('Раздел не найден')
            return {'data': json.loads(row['body']), 'revision': row['revision']}

    def put(self, name, data, revision):
        if not isinstance(data, list) or len(data) > 10000:
            raise ValueError('Ожидается список материалов (не более 10000)')
        data = clean(data)
        if any(not isinstance(item, dict) for item in data):
            raise ValueError('Каждый материал должен быть объектом')
        with self.lock, self.connect() as db:
            changed = db.execute('UPDATE content SET body=?, revision=revision+1 WHERE name=? AND revision=?',
                                 (json.dumps(data, ensure_ascii=False), name, revision)).rowcount
            if not changed:
                abort(409, 'Материалы изменились. Обновите страницу перед сохранением.')
        return self.get(name)

    def submit(self, kind, action):
        with self.lock:
            if self.busy:
                abort(409, 'Дождитесь завершения текущей операции с резервной копией')
            self.busy = True
            job_id = uuid.uuid4().hex
            self.jobs[job_id] = {'id': job_id, 'kind': kind, 'status': 'running', 'message': 'Обработка…'}

        def run():
            try:
                result = action()
                self.jobs[job_id].update(status='done', message='Готово', result=result)
                self.last_error = None
            except Exception as error:
                LOG.exception('Background %s failed', kind)
                self.last_error = str(error)
                self.jobs[job_id].update(status='failed', message=str(error))
            finally:
                with self.lock:
                    self.busy = False
                    # Bound metadata even on long-running installations.
                    for old in list(self.jobs)[:-50]:
                        self.jobs.pop(old, None)
        self.pool.submit(run)
        return self.jobs[job_id]

    def prune(self):
        cutoff = two_months_before(datetime.now(timezone.utc)).timestamp()
        for path in self.backups.glob('*.zip'):
            if path.stat().st_mtime < cutoff:
                path.unlink()

    def backup(self, reason='manual'):
        stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
        name = f'mt9-{stamp}-{reason}-{uuid.uuid4().hex[:6]}.zip'
        staging = self.tmp / uuid.uuid4().hex
        staging.mkdir()
        try:
            # Uploads are immutable, so only the SQLite snapshot needs the write
            # lock. Media added later is absent from this consistent snapshot.
            with self.lock:
                generation = self.current
                with self.connect() as source, sqlite3.connect(staging / 'content.sqlite3') as target:
                    source.backup(target)
                    media = source.execute('SELECT id, size, sha256 FROM media').fetchall()
            files = {'content.sqlite3': staging / 'content.sqlite3'}
            files.update({f'uploads/{row["id"]}': generation / 'uploads' / row['id'] for row in media})
            manifest = {'format': 'mt9-full-backup', 'version': 1, 'created_at': stamp, 'files': {}}
            archive = staging / name
            with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_STORED, allowZip64=True) as out:
                for relative, path in files.items():
                    manifest['files'][relative] = {'size': path.stat().st_size, 'sha256': digest(path)}
                    out.write(path, relative)
                out.writestr('manifest.json', json.dumps(manifest))
            # A final archive becomes visible only after it is complete.
            os.replace(archive, self.backups / name)
            self.prune()
            if reason == 'scheduled':
                marker = self.root / 'last-scheduled.tmp'
                marker.write_text(str(time.time()))
                os.replace(marker, self.root / 'last-scheduled')
            return {'filename': name}
        finally:
            shutil.rmtree(staging, ignore_errors=True)

    def restore(self, archive, max_expanded):
        staging = self.generations / uuid.uuid4().hex
        staging.mkdir()
        try:
            with zipfile.ZipFile(archive) as source:
                members = source.infolist()
                names = [entry.filename for entry in members]
                if len(names) != len(set(names)) or len(names) > 100000:
                    raise ValueError('Повторяющиеся файлы или слишком много файлов в архиве')
                if sum(entry.file_size for entry in members) > max_expanded:
                    raise ValueError('Распакованный архив превышает разрешённый размер')
                info = source.getinfo('manifest.json')
                if info.file_size > 16 * 1024 * 1024:
                    raise ValueError('Слишком большой манифест')
                manifest = json.loads(source.read('manifest.json'))
                if manifest.get('format') != 'mt9-full-backup' or manifest.get('version') != 1:
                    raise ValueError('Неподдерживаемый формат копии')
                expected = manifest['files']
                if set(names) != set(expected) | {'manifest.json'} or 'content.sqlite3' not in expected:
                    raise ValueError('Неполная копия или лишние файлы')
                for entry in members:
                    relative = PurePosixPath(entry.filename)
                    allowed = entry.filename == 'content.sqlite3' or (
                        len(relative.parts) == 2 and relative.parts[0] == 'uploads'
                        and relative.parts[1] not in ('.', '..'))
                    if entry.filename == 'manifest.json':
                        continue
                    mode = entry.external_attr >> 16
                    if not allowed or entry.is_dir() or (mode & 0o170000) not in (0, 0o100000):
                        raise ValueError('Небезопасный путь или тип файла в архиве')
                    if '\\' in entry.filename or relative.is_absolute() or '..' in relative.parts:
                        raise ValueError('Небезопасный путь в архиве')
                    target = staging / entry.filename
                    target.parent.mkdir(exist_ok=True)
                    with source.open(entry) as incoming, target.open('wb') as out:
                        shutil.copyfileobj(incoming, out, length=1024 * 1024)
                    check = expected[entry.filename]
                    if target.stat().st_size != check['size'] or digest(target) != check['sha256']:
                        raise ValueError('Копия повреждена: контрольная сумма не совпадает')
            (staging / 'uploads').mkdir(exist_ok=True)
            with sqlite3.connect(staging / 'content.sqlite3') as db:
                if db.execute("SELECT count(*) FROM sqlite_master WHERE type IN ('trigger', 'view')").fetchone()[0]:
                    raise ValueError('Копия содержит недопустимые объекты базы данных')
                if db.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
                    raise ValueError('База данных повреждена')
                if db.execute('PRAGMA user_version').fetchone()[0] != 1:
                    raise ValueError('Версия базы данных не поддерживается')
                if {r[0] for r in db.execute('SELECT name FROM content')} != set(COLLECTIONS):
                    raise ValueError('В копии отсутствуют разделы сайта')
                for name, body, revision in db.execute('SELECT name, body, revision FROM content').fetchall():
                    data = json.loads(body)
                    if not isinstance(data, list) or any(not isinstance(item, dict) for item in data):
                        raise ValueError('Неверная структура материалов')
                    db.execute('UPDATE content SET body=?, revision=? WHERE name=?',
                               (json.dumps(clean(data), ensure_ascii=False), time.time_ns(), name))
                media = db.execute('SELECT id, size, sha256 FROM media').fetchall()
                if set(expected) != {'content.sqlite3'} | {f'uploads/{row[0]}' for row in media}:
                    raise ValueError('Список файлов не соответствует базе данных')
                for file_id, size, sha in media:
                    meta = expected[f'uploads/{file_id}']
                    if meta['size'] != size or meta['sha256'] != sha:
                        raise ValueError('Метаданные файлов повреждены')
            # Freeze writes through safety snapshot and atomic generation switch.
            # Until activation, every public request sees the old live data.
            with self.lock:
                safety = self.backup('before-restore')
                self.activate(staging)
            return {'safety_backup': safety['filename']}
        finally:
            archive.unlink(missing_ok=True)
            if staging.exists() and staging.resolve() != self.current:
                shutil.rmtree(staging, ignore_errors=True)
            # Old live generation stays until restart, allowing in-flight file
            # downloads to finish even after the pointer switch.


def create_app(config=None):
    app = Flask(__name__)
    app.config.update(SECRET_KEY=os.environ.get('SECRET_KEY', ''),
                      ADMIN_PASSWORD=os.environ.get('ADMIN_PASSWORD', ''),
                      ADMIN_USER=os.environ.get('ADMIN_USER', 'admin'),
                      INTERNAL_TOKEN=os.environ.get('INTERNAL_TOKEN', ''),
                      DATA_DIR=os.environ.get('DATA_DIR', '/data'),
                      MAX_UPLOAD_BYTES=int(os.environ.get('MAX_UPLOAD_BYTES', 2 * 1024**3)),
                      MAX_BACKUP_BYTES=int(os.environ.get('MAX_BACKUP_BYTES', 100 * 1024**3)),
                      SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE='Strict',
                      SESSION_COOKIE_SECURE=os.environ.get('COOKIE_SECURE', 'false').lower() == 'true',
                      PERMANENT_SESSION_LIFETIME=timedelta(hours=8),
                      MAX_FORM_MEMORY_SIZE=1024 * 1024, MAX_FORM_PARTS=8)
    if config:
        app.config.update(config)
    if len(app.config['SECRET_KEY']) < 32 or len(app.config['ADMIN_PASSWORD']) < 12 or len(app.config['INTERNAL_TOKEN']) < 32:
        raise RuntimeError('Задайте SECRET_KEY и INTERNAL_TOKEN (32+ символа), ADMIN_PASSWORD (12+ символов)')
    seed_path = Path(__file__).with_name('seed.json')
    store = Store(app.config['DATA_DIR'], json.loads(seed_path.read_text()))
    app.extensions['store'] = store
    password_hash = generate_password_hash(app.config['ADMIN_PASSWORD'])
    login_attempts = {}
    login_lock = threading.Lock()

    def admin(func):
        @wraps(func)
        def wrapped(*args, **kwargs):
            if session.get('admin') != app.config['ADMIN_USER']:
                abort(401, 'Войдите в админку')
            if request.method not in ('GET', 'HEAD'):
                if not hmac.compare_digest(request.headers.get('X-CSRF-Token', ''), session.get('csrf', secrets.token_hex())):
                    abort(403, 'Обновите страницу и повторите действие')
            return func(*args, **kwargs)
        return wrapped

    @app.before_request
    def limits():
        request.max_content_length = 2 * 1024 * 1024
        if request.path == '/api/admin/upload':
            request.max_content_length = app.config['MAX_UPLOAD_BYTES'] + 1024 * 1024
        elif request.path == '/api/admin/restore':
            request.max_content_length = app.config['MAX_BACKUP_BYTES'] + 1024 * 1024

    @app.after_request
    def headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['Cache-Control'] = 'no-store'
        return response

    @app.errorhandler(Exception)
    def error_response(error):
        if isinstance(error, HTTPException):
            return jsonify(error=error.description), error.code
        if isinstance(error, (ValueError, KeyError, zipfile.BadZipFile)):
            return jsonify(error=str(error)), 400
        LOG.exception('Request failed')
        return jsonify(error='Ошибка сервера. Подробности записаны в журнал.'), 500

    @app.get('/api/health')
    def health():
        with store.lock, store.connect() as db:
            db.execute('SELECT 1 FROM content LIMIT 1').fetchone()
        return jsonify(status='ok')

    @app.get('/api/content/<name>')
    def public_content(name):
        if name not in COLLECTIONS:
            abort(404)
        result = store.get(name)
        result['data'] = [item for item in result['data'] if item.get('_status', 'published') == 'published']
        return jsonify(result)

    @app.post('/api/admin/login')
    def login():
        # Only nginx may set this header: its config overwrites client values.
        address = request.headers.get('X-Real-IP', request.remote_addr)
        now = time.time()
        with login_lock:
            for key in list(login_attempts):
                if now - login_attempts[key][1] > 900:
                    login_attempts.pop(key)
            count, _ = login_attempts.get(address, (0, now))
            if count >= 10:
                abort(429, 'Слишком много попыток. Повторите через 15 минут.')
            login_attempts[address] = (count + 1, now)
        data = request.get_json() or {}
        good_password = check_password_hash(password_hash, data.get('password', ''))
        if data.get('username') != app.config['ADMIN_USER'] or not good_password:
            abort(401, 'Неверный логин или пароль')
        with login_lock:
            login_attempts.pop(address, None)
        session.clear()
        session.permanent = True
        session.update(admin=app.config['ADMIN_USER'], csrf=secrets.token_hex(32))
        return jsonify(csrf=session['csrf'], username=session['admin'])

    @app.get('/api/admin/session')
    @admin
    def current_session():
        return jsonify(csrf=session['csrf'], username=session['admin'])

    @app.post('/api/admin/logout')
    @admin
    def logout():
        session.clear()
        return jsonify(ok=True)

    @app.route('/api/admin/content/<name>', methods=['GET', 'PUT'])
    @admin
    def content(name):
        if name not in COLLECTIONS:
            abort(404)
        if request.method == 'GET':
            return jsonify(store.get(name))
        data = request.get_json() or {}
        return jsonify(store.put(name, data['data'], data['revision']))

    @app.post('/api/admin/upload')
    @admin
    def upload():
        incoming = request.files.get('file')
        if not incoming or not incoming.filename:
            abort(400, 'Выберите файл')
        name = incoming.filename.replace('\\', '/').split('/')[-1]
        if len(name) > 240 or any(ord(c) < 32 for c in name):
            abort(400, 'Недопустимое имя файла')
        extension = Path(name).suffix.lower()
        file_id = uuid.uuid4().hex + (extension if extension in INLINE_EXT else '')
        staging = store.tmp / uuid.uuid4().hex
        size, checksum = 0, hashlib.sha256()
        try:
            with staging.open('wb') as out:
                for chunk in iter(lambda: incoming.stream.read(1024 * 1024), b''):
                    size += len(chunk)
                    if size > app.config['MAX_UPLOAD_BYTES']:
                        abort(413, 'Размер файла превышает 2 ГБ')
                    out.write(chunk)
                    checksum.update(chunk)
            with store.lock, store.connect() as db:
                target = store.current / 'uploads' / file_id
                os.replace(staging, target)
                try:
                    db.execute('INSERT INTO media VALUES (?, ?, ?, ?)', (file_id, name, size, checksum.hexdigest()))
                except Exception:
                    target.unlink(missing_ok=True)
                    raise
            return jsonify(id=file_id, name=name, size=size, url=f'/uploads/{file_id}'), 201
        finally:
            staging.unlink(missing_ok=True)

    @app.get('/api/admin/media')
    @admin
    def media():
        with store.lock, store.connect() as db:
            rows = db.execute('SELECT id, name, size FROM media ORDER BY rowid DESC').fetchall()
        return jsonify(files=[dict(row, url=f'/uploads/{row["id"]}') for row in rows])

    @app.post('/api/admin/import-legacy')
    @admin
    def import_legacy():
        from legacy_media import import_media
        return jsonify(store.submit('import', lambda: import_media(store, app.config['MAX_UPLOAD_BYTES']))), 202

    @app.get('/uploads/<file_id>')
    def download_media(file_id):
        with store.lock, store.connect() as db:
            row = db.execute('SELECT * FROM media WHERE id=?', (file_id,)).fetchone()
            if row is None:
                abort(404, 'Файл не найден')
            path = store.current / 'uploads' / file_id
            response = send_file(path, as_attachment=Path(file_id).suffix not in INLINE_EXT,
                                 download_name=row['name'], conditional=True)
        response.headers['Content-Security-Policy'] = "default-src 'none'; sandbox"
        return response

    @app.route('/api/admin/backups', methods=['GET', 'POST'])
    @admin
    def backups():
        if request.method == 'POST':
            return jsonify(store.submit('backup', store.backup)), 202
        marker = store.root / 'last-scheduled'
        last = float(marker.read_text()) if marker.exists() else None
        return jsonify(files=[{'name': p.name, 'size': p.stat().st_size, 'created': p.stat().st_mtime}
                              for p in sorted(store.backups.glob('*.zip'), reverse=True)],
                       jobs=list(store.jobs.values()), busy=store.busy, last_error=store.last_error,
                       last_scheduled=last, next_scheduled=last + 7 * 86400 if last else None,
                       retention_months=2)

    @app.get('/api/admin/backups/<filename>')
    @admin
    def download_backup(filename):
        if Path(filename).name != filename or not filename.endswith('.zip'):
            abort(404)
        return send_file(store.backups / filename, as_attachment=True)

    @app.get('/api/admin/jobs/<job_id>')
    @admin
    def job(job_id):
        if job_id not in store.jobs:
            abort(404, 'Операция не найдена. Проверьте список резервных копий.')
        return jsonify(store.jobs[job_id])

    @app.post('/api/admin/restore')
    @admin
    def restore():
        if request.form.get('confirm') != 'RESTORE':
            abort(400, 'Подтвердите замену данных')
        incoming = request.files.get('file')
        if incoming is None:
            abort(400, 'Выберите архив')
        staging = store.tmp / f'{uuid.uuid4().hex}.zip'
        try:
            incoming.save(staging)
            return jsonify(store.submit('restore', lambda: store.restore(staging, app.config['MAX_BACKUP_BYTES']))), 202
        except Exception:
            staging.unlink(missing_ok=True)
            raise

    @app.post('/api/internal/scheduled-backup')
    def scheduled():
        if not hmac.compare_digest(request.headers.get('Authorization', ''), 'Bearer ' + app.config['INTERNAL_TOKEN']):
            abort(401)
        with store.lock:
            marker = store.root / 'last-scheduled'
            last = float(marker.read_text()) if marker.exists() else 0
            if time.time() - last < 7 * 86400 or store.busy:
                return jsonify(status='not_due_or_busy')
            return jsonify(store.submit('backup', lambda: store.backup('scheduled'))), 202

    return app


if __name__ == '__main__':
    create_app().run(host='0.0.0.0', port=8000)
elif os.environ.get('DATA_DIR'):
    app = create_app()
