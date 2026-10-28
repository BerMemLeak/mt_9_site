"""The API decides when a successful weekly backup is due; retries after restart."""
import logging
import os
import time
import urllib.request

logging.basicConfig(level=logging.INFO)
while True:
    try:
        req = urllib.request.Request('http://backend:8000/api/internal/scheduled-backup',
                                     data=b'', headers={'Authorization': 'Bearer ' + os.environ['INTERNAL_TOKEN']})
        with urllib.request.urlopen(req, timeout=30) as response:
            logging.info('Backup scheduler: %s', response.read().decode())
    except Exception:
        logging.exception('Cannot request scheduled backup; retry in one hour')
    time.sleep(3600)
