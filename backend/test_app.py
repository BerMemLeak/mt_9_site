import hashlib
import io
import json
import os
from pathlib import Path
import sqlite3
import threading
import time
import zipfile
from datetime import datetime, timezone

import pytest

from app import COLLECTIONS, create_app, two_months_before


@pytest.fixture
def application(tmp_path):
    app = create_app({'TESTING': True, 'DATA_DIR': str(tmp_path / 'data'),
                      'SECRET_KEY': 's' * 48, 'INTERNAL_TOKEN': 't' * 48,
                      'ADMIN_PASSWORD': 'a-test-password-123', 'MAX_UPLOAD_BYTES': 4096,
                      'MAX_BACKUP_BYTES': 20 * 1024**2})
    yield app
    app.extensions['store'].pool.shutdown(wait=True)


@pytest.fixture
def authenticated(application):
    client = application.test_client()
    response = client.post('/api/admin/login', json={'username': 'admin', 'password': 'a-test-password-123'})
    assert response.status_code == 200
    return client, {'X-CSRF-Token': response.json['csrf']}


def wait(application, job_id):
    store = application.extensions['store']
    deadline = time.time() + 10
    while time.time() < deadline:
        job = store.jobs[job_id]
        if job['status'] != 'running':
            return job
        time.sleep(.01)
    pytest.fail('Background job did not finish')


def test_auth_csrf_and_private_backups(application, authenticated):
    client, headers = authenticated
    outsider = application.test_client()
    assert outsider.get('/api/admin/backups').status_code == 401
    assert outsider.get('/api/admin/media').status_code == 401
    assert client.post('/api/admin/backups', json={}).status_code == 403
    assert outsider.post('/api/internal/scheduled-backup').status_code == 401
    assert client.post('/api/admin/logout', headers=headers).status_code == 200
    assert client.get('/api/admin/session').status_code == 401


def test_content_drafts_xss_and_revision(application, authenticated):
    client, headers = authenticated
    current = client.get('/api/admin/content/news').json
    records = [
        {'id': 'one', 'title': 'Published', 'content': '<p onclick="evil()">Good<script>alert(1)</script></p>'},
        {'id': 'two', 'title': 'Secret draft', '_status': 'draft'},
        {'id': 'three', 'title': 'Archived', '_status': 'archived'}]
    response = client.put('/api/admin/content/news', headers=headers,
                          json={'data': records, 'revision': current['revision']})
    assert response.status_code == 200
    public = client.get('/api/content/news').json['data']
    assert len(public) == 1
    assert 'onclick' not in public[0]['content'] and '<script' not in public[0]['content']
    assert client.put('/api/admin/content/news', headers=headers,
                      json={'data': [], 'revision': current['revision']}).status_code == 409
    records[0]['image'] = 'javascript:alert(1)'
    assert client.put('/api/admin/content/news', headers=headers,
                      json={'data': records, 'revision': response.json['revision']}).status_code == 400


def test_upload_limits_download_and_html_attachment(application, authenticated):
    client, headers = authenticated
    response = client.post('/api/admin/upload', headers=headers,
                           data={'file': (io.BytesIO(b'hello\x00world'), 'Документ.pdf')})
    assert response.status_code == 201
    downloaded = client.get(response.json['url'])
    assert downloaded.data == b'hello\x00world'
    assert 'attachment' in downloaded.headers['Content-Disposition']
    assert client.post('/api/admin/upload', headers=headers,
                       data={'file': (io.BytesIO(b'x' * 4097), 'large.zip')}).status_code == 413
    html = client.post('/api/admin/upload', headers=headers,
                       data={'file': (io.BytesIO(b'<script>evil()</script>'), 'page.html')}).json
    downloaded = client.get(html['url'])
    assert 'attachment' in downloaded.headers['Content-Disposition']
    assert downloaded.headers['X-Content-Type-Options'] == 'nosniff'
    assert client.get('/uploads/not-found').status_code == 404


def test_full_backup_restore_into_fresh_site(application, authenticated, tmp_path):
    client, headers = authenticated
    uploaded = client.post('/api/admin/upload', headers=headers,
                           data={'file': (io.BytesIO(b'media-original'), 'original.png')}).json
    original = client.get('/api/admin/content/news').json
    job = client.post('/api/admin/backups', headers=headers).json
    complete = wait(application, job['id'])
    assert complete['status'] == 'done'
    archive = client.get('/api/admin/backups/' + complete['result']['filename']).data
    with zipfile.ZipFile(io.BytesIO(archive)) as snapshot:
        assert f'uploads/{uploaded["id"]}' in snapshot.namelist()
        assert 'manifest.json' in snapshot.namelist()
    # Change live content; restore must replace it and preserve a safety archive.
    client.put('/api/admin/content/news', headers=headers, json={'data': [], 'revision': original['revision']})
    restored = client.post('/api/admin/restore', headers=headers,
                           data={'confirm': 'RESTORE', 'file': (io.BytesIO(archive), 'backup.zip')})
    assert restored.status_code == 202
    result = wait(application, restored.json['id'])
    assert result['status'] == 'done', result
    assert client.get('/api/admin/content/news').json['data'] == original['data']
    assert client.get(uploaded['url']).data == b'media-original'
    assert (application.extensions['store'].backups / result['result']['safety_backup']).exists()
    # A fresh server can restore this archive without the old volume.
    fresh = create_app({'TESTING': True, 'DATA_DIR': str(tmp_path / 'fresh'),
                        'SECRET_KEY': 'f' * 40, 'INTERNAL_TOKEN': 't' * 40,
                        'ADMIN_PASSWORD': 'fresh-password-123'})
    target = fresh.extensions['store']
    incoming = target.tmp / 'fresh.zip'
    incoming.write_bytes(archive)
    target.restore(incoming, 20 * 1024**2)
    assert target.get('news')['data'] == original['data']
    assert (target.current / 'uploads' / uploaded['id']).read_bytes() == b'media-original'
    target.pool.shutdown(wait=True)


def make_archive(path, entries):
    with zipfile.ZipFile(path, 'w') as out:
        manifest = {'format': 'mt9-full-backup', 'version': 1, 'files': {}}
        for name, data in entries.items():
            out.writestr(name, data)
            manifest['files'][name] = {'size': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
        out.writestr('manifest.json', json.dumps(manifest))


@pytest.mark.parametrize('bad_name', ['../escape', '/tmp/escape', 'uploads/../../escape', 'uploads/../escape', 'uploads\\escape'])
def test_restore_rejects_traversal_without_changing_live_data(application, bad_name):
    store = application.extensions['store']
    before = store.current
    incoming = store.tmp / 'bad.zip'
    make_archive(incoming, {'content.sqlite3': b'not a db', bad_name: b'evil'})
    with pytest.raises(ValueError):
        store.restore(incoming, 100000)
    assert store.current == before
    assert store.get('news')['data']


def test_corrupt_archive_and_oversize_leave_live_database_intact(application):
    store = application.extensions['store']
    before = store.current
    name = store.backup()['filename']
    good = store.backups / name
    incoming = store.tmp / 'large.zip'
    shutil_copy(good, incoming)
    with pytest.raises(ValueError):
        store.restore(incoming, 1)
    incoming.write_bytes(b'not a ZIP')
    with pytest.raises(zipfile.BadZipFile):
        store.restore(incoming, 1000)
    assert store.current == before


def shutil_copy(source, target):
    target.write_bytes(source.read_bytes())


def test_weekly_schedule_and_two_calendar_month_retention(application, authenticated):
    store = application.extensions['store']
    old = store.backups / 'old.zip'
    old.write_bytes(b'old')
    ancient = datetime(2020, 1, 1, tzinfo=timezone.utc).timestamp()
    os.utime(old, (ancient, ancient))
    recent = store.backups / 'recent.zip'
    recent.write_bytes(b'recent')
    client, _ = authenticated
    response = client.post('/api/internal/scheduled-backup', headers={'Authorization': 'Bearer ' + 't' * 48})
    assert response.status_code == 202
    assert wait(application, response.json['id'])['status'] == 'done'
    assert not old.exists() and recent.exists()
    assert client.post('/api/internal/scheduled-backup', headers={'Authorization': 'Bearer ' + 't' * 48}).json['status'] == 'not_due_or_busy'
    assert two_months_before(datetime(2026, 4, 30)).isoformat() == '2026-02-28T00:00:00'
    assert two_months_before(datetime(2026, 1, 31)).isoformat() == '2025-11-30T00:00:00'


def test_only_one_background_job(application):
    store = application.extensions['store']
    done = threading.Event()
    first = store.submit('test', lambda: done.wait(5))
    try:
        with application.test_request_context(), pytest.raises(Exception) as error:
            store.submit('test', lambda: None)
        assert error.value.code == 409
    finally:
        done.set()
    assert wait(application, first['id'])['status'] == 'done'


def test_migration_keeps_all_sections_and_embedded_legacy_images(application):
    store = application.extensions['store']
    assert len(store.get('announcements')['data']) == 14
    assert len(store.get('teachers')['data']) == 17
    assert len(store.get('pages')['data']) == 4
    assert set(COLLECTIONS) == {row[0] for row in store.connect().execute('SELECT name FROM content')}
    about = next(p for p in store.get('pages')['data'] if p['id'] == 'about')
    assert '/legacy/' not in about['body'] and '/uploads/' in about['body']
    archive = store.backup()['filename']
    with zipfile.ZipFile(store.backups / archive) as backup:
        assert any(name.startswith('uploads/') for name in backup.namelist())


def test_restore_requires_explicit_confirmation(authenticated):
    client, headers = authenticated
    assert client.post('/api/admin/restore', headers=headers,
                       data={'file': (io.BytesIO(b'bad'), 'backup.zip')}).status_code == 400


def test_legacy_import_candidates_and_private_network_rejection(monkeypatch):
    import legacy_media
    found = legacy_media.candidates(json.dumps({'image': 'http://design.bmstu.ru/photo.jpg',
        'file': '/assets/docs/guide.docx', 'site': 'https://bmstu.ru/',
        'unknown': 'https://unknown.example/image.png'}))
    assert found == {'http://design.bmstu.ru/photo.jpg', '/assets/docs/guide.docx'}
    with pytest.raises(ValueError):
        legacy_media.safe_url('http://127.0.0.1/private.pdf')
    monkeypatch.setattr(legacy_media.socket, 'getaddrinfo', lambda *args, **kwargs: [(2, 1, 6, '', ('127.0.0.1', 80))])
    with pytest.raises(ValueError):
        legacy_media.safe_url('http://design.bmstu.ru/private.pdf')


def test_legacy_import_downloads_file_and_keeps_failed_links(application, monkeypatch):
    import legacy_media
    store = application.extensions['store']
    source = 'http://design.bmstu.ru/photo.jpg'
    failed = 'http://design.bmstu.ru/missing.pdf'
    for name in COLLECTIONS:
        data = [{'id': 'legacy', 'image': source, 'file': failed}] if name == 'cases' else []
        store.put(name, data, store.get(name)['revision'])
    class Response(io.BytesIO):
        headers = {'Content-Type': 'image/jpeg', 'Content-Length': '5'}
    class Opener:
        def open(self, request, timeout):
            if request.full_url == failed:
                raise ValueError('missing')
            return Response(b'photo')
    monkeypatch.setattr(legacy_media, 'safe_url', lambda value: value)
    monkeypatch.setattr(legacy_media.urllib.request, 'build_opener', lambda *args: Opener())
    result = legacy_media.import_media(store, 1000)
    assert result['imported'] == 1 and len(result['failed']) == 1
    record = store.get('cases')['data'][0]
    assert record['image'].startswith('/uploads/') and record['file'] == failed
    assert (store.current / record['image'].lstrip('/')).read_bytes() == b'photo'
