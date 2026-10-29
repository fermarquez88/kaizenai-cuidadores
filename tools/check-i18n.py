#!/usr/bin/env python3
"""Revisa el diccionario en ingles de index.html antes de publicar.
Si el JSON no es valido, la pagina queda en espanol aunque el usuario elija EN.
Uso: python3 tools/check-i18n.py   (sale con codigo 1 si el JSON falla o faltan claves)
"""
import re, sys, json
s = open(sys.argv[1] if len(sys.argv) > 1 else 'index.html', encoding='utf-8').read()
m = re.search(r'<script type="application/json" id="i18n-en">(.*?)</script>', s, re.S)
if not m:
    print('No se encontro el bloque i18n-en'); sys.exit(1)
try:
    en = json.loads(m.group(1))
except json.JSONDecodeError as e:
    print(f'JSON invalido: {e}'); sys.exit(1)
html = s[:m.start()]
keys = set(re.findall(r'data-i18n(?:-aria|-title|-ph|-content)?="([^"]+)"', html))
missing = sorted(k for k in keys if k not in en)
print(f'{len(en)} claves en ingles, {len(keys)} usadas en la pagina, {len(missing)} sin traduccion')
for k in missing: print(f'  {k}')
sys.exit(1 if missing else 0)
