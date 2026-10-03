#!/usr/bin/env python3
"""Revisa los enlaces externos de index.html antes de publicar.
Uso: python3 tools/check-links.py   (sale con codigo 1 si hay enlaces rotos)
"""
import re, sys, subprocess, html
from concurrent.futures import ThreadPoolExecutor
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36'
HDR = ['-A', UA, '-H', 'Accept: text/html,application/xhtml+xml,*/*', '-H', 'Accept-Language: es-AR,es;q=0.9']
s = open(sys.argv[1] if len(sys.argv) > 1 else 'index.html', encoding='utf-8').read()
s = s[:s.index('<script type="application/json" id="i18n-en">')]
urls = sorted({html.unescape(u) for u in re.findall(r'href="(https?://[^"]+)"', s)})
def check(u):
    r = subprocess.run(['curl', '-sIL', '-o', '/dev/null', '-w', '%{http_code}', '--max-time', '20'] + HDR + [u], capture_output=True, text=True)
    code = r.stdout.strip() or '000'
    if code in ('405', '403', '000'):  # algunos sitios no aceptan HEAD: reintentar con GET
        r = subprocess.run(['curl', '-sL', '-o', '/dev/null', '-w', '%{http_code}', '--max-time', '25'] + HDR + [u], capture_output=True, text=True)
        code = r.stdout.strip() or '000'
    return u, code
with ThreadPoolExecutor(8) as ex:
    res = list(ex.map(check, urls))
bad = [(u, c) for u, c in res if not c.startswith(('2', '3'))]
print(f'{len(urls)} enlaces, {len(bad)} con problemas')
for u, c in bad: print(f'  {c}  {u}')
sys.exit(1 if bad else 0)
