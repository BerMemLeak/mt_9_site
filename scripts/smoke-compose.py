"""Black-box check through the real Compose nginx frontend."""
import http.cookiejar
import json
from pathlib import Path
import time
import urllib.error
import urllib.request

settings = dict(line.split('=', 1) for line in Path('.env').read_text().splitlines() if line and not line.startswith('#'))
base = 'http://127.0.0.1:' + settings.get('SITE_PORT', '8080')
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
csrf = ''

def request(path, method='GET', data=None, content_type='application/json'):
    headers = {'Content-Type': content_type, 'X-CSRF-Token': csrf}
    req = urllib.request.Request(base + path, data=data, method=method, headers=headers)
    with opener.open(req, timeout=60) as response:
        return response.read()

def payload(value):
    return json.dumps(value).encode()

def wait(job):
    for _ in range(120):
        result = json.loads(request('/api/admin/jobs/' + job['id']))
        if result['status'] == 'done':
            return result
        if result['status'] == 'failed':
            raise AssertionError(result)
        time.sleep(.5)
    raise AssertionError('Job timed out')

def multipart(fields, name, body):
    boundary = 'mt9-compose-smoke-boundary'
    parts = []
    for key, value in fields.items():
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode())
    parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{name}"\r\nContent-Type: application/octet-stream\r\n\r\n'.encode())
    parts.extend([body, f'\r\n--{boundary}--\r\n'.encode()])
    return b''.join(parts), 'multipart/form-data; boundary=' + boundary

assert json.loads(request('/api/health'))['status'] == 'ok'
assert b'<div id="root">' in request('/admin')
for path in ['/server.js', '/assets/docs/missing.docx', '/api/internal/scheduled-backup']:
    try:
        request(path)
        raise AssertionError('Expected 404: ' + path)
    except urllib.error.HTTPError as error:
        assert error.code == 404, (path, error.code)
login = json.loads(request('/api/admin/login', 'POST', payload({'username': settings.get('ADMIN_USER','admin'), 'password': settings['ADMIN_PASSWORD']})))
csrf = login['csrf']
body, kind = multipart({}, 'compose-smoke.txt', b'compose media')
uploaded = json.loads(request('/api/admin/upload', 'POST', body, kind))
assert request(uploaded['url']) == b'compose media'
original = json.loads(request('/api/admin/content/news'))
# Wait until the initial scheduled backup finishes.
for _ in range(120):
    if not json.loads(request('/api/admin/backups'))['busy']:
        break
    time.sleep(.5)
backup = wait(json.loads(request('/api/admin/backups', 'POST', b'{}')))
archive = request('/api/admin/backups/' + backup['result']['filename'])
request('/api/admin/content/news', 'PUT', payload({'data': [], 'revision': original['revision']}))
body, kind = multipart({'confirm': 'RESTORE'}, 'copy.zip', archive)
wait(json.loads(request('/api/admin/restore', 'POST', body, kind)))
assert json.loads(request('/api/admin/content/news'))['data'] == original['data']
assert request(uploaded['url']) == b'compose media'
print('Compose smoke passed: nginx, API, missing-file 404, upload, backup and restore.')
