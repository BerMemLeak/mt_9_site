"""Copy historic public BMSTU media onto this server. Failed URLs stay intact."""
import hashlib
import html
import ipaddress
import json
from pathlib import Path
import re
import socket
import urllib.parse
import urllib.request
import uuid

ALLOWED_HOSTS = {'design.bmstu.ru', 'mgppu.ru', 'www.mgppu.ru', 'bmstu.ru', 'www.bmstu.ru',
                 'isot.bmstu.ru', 'cendop.bmstu.ru', 'ebooks.bmstu.ru'}
EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.pdf', '.doc', '.docx',
              '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar', '.mp4', '.webm'}
INLINE = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.mp4', '.webm'}


def safe_url(url):
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme not in ('http', 'https') or parsed.hostname not in ALLOWED_HOSTS or parsed.username or parsed.password:
        raise ValueError('Импорт разрешён только с исходных сайтов университета')
    if parsed.port not in (None, 80, 443):
        raise ValueError('Недопустимый порт источника')
    for result in socket.getaddrinfo(parsed.hostname, parsed.port or 443, type=socket.SOCK_STREAM):
        if not ipaddress.ip_address(result[4][0]).is_global:
            raise ValueError('Непубличный адрес источника')
    return url


class SafeRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return super().redirect_request(req, fp, code, msg, headers, safe_url(newurl))


def candidates(text):
    # Includes local paths that were copied from the old site but are absent here.
    pattern = r'''(?:https?://[^\s<>"'\\]+|/(?:assets|ru)/[^\s<>"'\\]+)'''
    result = set()
    for match in re.findall(pattern, text):
        decoded = html.unescape(match)
        parsed = urllib.parse.urlsplit(decoded)
        if Path(urllib.parse.unquote(parsed.path)).suffix.lower() not in EXTENSIONS:
            continue
        if parsed.hostname and parsed.hostname not in ALLOWED_HOSTS:
            continue
        result.add(match)
    return result


def import_media(store, limit):
    opener = urllib.request.build_opener(SafeRedirect())
    snapshots = {name: store.get(name) for name in store.collection_names}
    sources = candidates(json.dumps({name: row['data'] for name, row in snapshots.items()}, ensure_ascii=False))
    replacements, failed = {}, []
    for original in sorted(sources):
        decoded = html.unescape(original)
        url = decoded if decoded.startswith('http') else 'http://design.bmstu.ru' + decoded
        staging = store.tmp / uuid.uuid4().hex
        try:
            safe_url(url)
            request = urllib.request.Request(urllib.parse.quote(url, safe=':/?=&%+'), headers={'User-Agent': 'MT9-Media-Migration/1.0'})
            with opener.open(request, timeout=15) as response, staging.open('wb') as out:
                if 'text/html' in response.headers.get('Content-Type', ''):
                    raise ValueError('Источник вернул HTML вместо файла')
                if int(response.headers.get('Content-Length', '0')) > limit:
                    raise ValueError('Файл превышает 2 ГБ')
                size, checksum = 0, hashlib.sha256()
                while True:
                    chunk = response.read(1024 * 1024)
                    if not chunk:
                        break
                    size += len(chunk)
                    if size > limit:
                        raise ValueError('Файл превышает 2 ГБ')
                    out.write(chunk)
                    checksum.update(chunk)
            name = Path(urllib.parse.unquote(urllib.parse.urlsplit(url).path)).name
            suffix = Path(name).suffix.lower()
            file_id = uuid.uuid4().hex + (suffix if suffix in INLINE else '')
            with store.lock, store.connect() as db:
                target = store.current / 'uploads' / file_id
                staging.replace(target)
                try:
                    db.execute('INSERT INTO media VALUES (?, ?, ?, ?)', (file_id, name, size, checksum.hexdigest()))
                except Exception:
                    target.unlink(missing_ok=True)
                    raise
            replacements[original] = '/uploads/' + file_id
        except Exception as error:
            failed.append({'url': url, 'error': str(error)})
        finally:
            staging.unlink(missing_ok=True)
    skipped = []
    with store.lock:
        for name, snapshot in snapshots.items():
            if store.get(name)['revision'] != snapshot['revision']:
                skipped.append(name)
                continue
            text = json.dumps(snapshot['data'], ensure_ascii=False)
            # Longest first prevents replacing a prefix of another URL.
            for old, new in sorted(replacements.items(), key=lambda item: len(item[0]), reverse=True):
                text = text.replace(old, new)
            store.put(name, json.loads(text), snapshot['revision'])
    report = {'imported': len(replacements), 'failed': failed, 'skipped_sections': skipped}
    (store.root / 'legacy-import-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
    return report
