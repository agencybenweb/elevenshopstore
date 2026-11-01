import urllib.request
import re

url = 'https://www.redbull.com/fr-fr/energydrink/products'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        matches = set(re.findall(r'https://www\.redbull\.com/energydrink/v1/resources/storyblok/images/[^"\'\s]+\.png', html))
        print(f'Found {len(matches)} Red Bull storyblok images:')
        for m in sorted(matches):
            print(m)
except Exception as e:
    print('Error:', e)
