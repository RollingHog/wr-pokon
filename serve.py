#!/usr/bin/env python3
"""
Сервер ходов для игры по локальной сети (вариант 2).

Раздает файлы проекта (как `python -m http.server`) и дополнительно держит
общий сейв на эндпоинте /api/save:

    GET  /api/save  -> {"version": N, "text": "...data.json.js..."}
                       (если сейва еще нет: {"version": 0, "text": null})
    PUT  /api/save  <- {"version": N, "text": "..."}
                       N должен совпадать с версией на сервере, иначе 409.

Запуск из корня проекта:

    python serve.py                 # порт 8123, сейв в .net/save.json
    python serve.py --port 9000
    python serve.py --save custom/pokras-spc/net-save.json

После запуска откройте в браузере (на обоих компьютерах):

    http://<ip-хоста>:8123/custom/pokras-spc.html?net=1

Файл сейва пишется только сервером; сам проект он не меняет.
Зависимостей нет, только стандартная библиотека Python 3.7+.
"""

import argparse
import json
import os
import socket
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
LOCK = threading.Lock()


class NetHandler(SimpleHTTPRequestHandler):
    """Статика проекта + API общего сейва."""

    save_path = os.path.join(ROOT, '.net', 'save.json')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    # ---------- служебное ----------

    def _api_path(self):
        return self.path.split('?', 1)[0].rstrip('/')

    def _send_json(self, code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        # чтобы браузеры не держали старые index.js / html при игре по сети
        if not self._api_path().startswith('/api/'):
            self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def _read_save(self):
        try:
            with open(self.save_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return int(data.get('version', 0)), data.get('text')
        except (OSError, ValueError, TypeError):
            return 0, None

    def _write_save(self, version, text):
        folder = os.path.dirname(self.save_path)
        if folder:
            os.makedirs(folder, exist_ok=True)
        tmp = self.save_path + '.tmp'
        with open(tmp, 'w', encoding='utf-8') as f:
            json.dump({'version': version, 'text': text}, f, ensure_ascii=False)
        os.replace(tmp, self.save_path)

    # ---------- HTTP ----------

    def do_OPTIONS(self):
        if self._api_path() == '/api/save':
            self._send_json(200, {})
            return
        self.send_error(404)

    def do_GET(self):
        if self._api_path() == '/api/save':
            with LOCK:
                version, text = self._read_save()
            self._send_json(200, {'version': version, 'text': text})
            return
        super().do_GET()

    def do_PUT(self):
        if self._api_path() != '/api/save':
            self._send_json(404, {'error': 'not found'})
            return
        try:
            length = int(self.headers.get('Content-Length') or 0)
            payload = json.loads(self.rfile.read(length).decode('utf-8'))
            client_version = int(payload.get('version', 0))
            text = payload.get('text')
            if not isinstance(text, str) or not text.strip():
                raise ValueError('empty save text')
        except (ValueError, TypeError, UnicodeDecodeError):
            self._send_json(400, {'error': 'bad request'})
            return

        with LOCK:
            version, _ = self._read_save()
            if client_version != version:
                # кто-то успел передать ход первым — пусть клиент сначала загрузит его
                self._send_json(409, {'error': 'version conflict', 'version': version})
                return
            version += 1
            self._write_save(version, text)

        self.log_message('ход принят: версия %s (%s байт)', version, len(text))
        self._send_json(200, {'version': version})


def lan_ip():
    """Первый разумный IPv4 в локальной сети (для подсказки в консоли)."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            # пакет никуда не уходит, нужен только маршрут по умолчанию
            sock.connect(('8.8.8.8', 80))
            return sock.getsockname()[0]
        finally:
            sock.close()
    except OSError:
        return '127.0.0.1'


def main():
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except (AttributeError, OSError):
        pass

    parser = argparse.ArgumentParser(description='Сервер ходов для игры по локальной сети')
    parser.add_argument('--port', type=int, default=8123, help='порт (по умолчанию 8123)')
    parser.add_argument('--host', default='0.0.0.0', help='адрес прослушивания (по умолчанию 0.0.0.0)')
    parser.add_argument('--save', default=NetHandler.save_path,
                        help='файл общего сейва (по умолчанию .net/save.json)')
    args = parser.parse_args()

    NetHandler.save_path = os.path.abspath(args.save)
    server = ThreadingHTTPServer((args.host, args.port), NetHandler)
    ip = lan_ip()

    print('Сервер ходов запущен.')
    print('  на этом компьютере: http://localhost:%d/' % args.port)
    print('  по локальной сети:  http://%s:%d/' % (ip, args.port))
    print('  откройте нужную кампанию и добавьте ?net=1, например:')
    print('    http://%s:%d/custom/pokras-spc.html?net=1' % (ip, args.port))
    print('  файл сейва:         %s' % NetHandler.save_path)
    print('Остановить: Ctrl+C')
    print('', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('')
        print('Сервер остановлен.')
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
