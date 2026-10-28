"""Explicit 2 GiB boundary test. Uses temporary disk space, never production data."""
import io
import os
from pathlib import Path
import sys
import tempfile

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'backend'))
from app import create_app

with tempfile.TemporaryDirectory(prefix='mt9-large-test-') as directory:
    app = create_app({'TESTING': True, 'DATA_DIR': directory + '/data',
                      'SECRET_KEY': 's' * 48, 'INTERNAL_TOKEN': 't' * 48,
                      'ADMIN_PASSWORD': 'large-test-password'})
    client = app.test_client()
    token = client.post('/api/admin/login', json={'username': 'admin', 'password': 'large-test-password'}).json['csrf']
    source = Path(directory) / 'large.bin'
    with source.open('wb') as stream:
        stream.truncate(2 * 1024**3)
    with source.open('rb') as stream:
        result = client.post('/api/admin/upload', headers={'X-CSRF-Token': token}, data={'file': (stream, 'large.bin')})
    assert result.status_code == 201, result.json
    assert result.json['size'] == 2147483648
    store = app.extensions['store']
    stored = store.current / 'uploads' / result.json['id']
    assert stored.stat().st_size == 2147483648
    # Boundary rejection is exercised with the same code path at a smaller limit
    # by the normal backend suite, avoiding a second 2 GiB temporary transfer.
    store.pool.shutdown(wait=True)
    print('2 GiB upload passed: exact boundary accepted, streamed to persistent media storage.')
