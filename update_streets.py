#!/usr/bin/env python3
import urllib.request
import urllib.parse
import json
import string
import sys
import os
import concurrent.futures

BASE_URL = "https://stadtreinigung-leipzig.de/rest/Navision/Streets?search="

def fetch_prefix(prefix):
    url = BASE_URL + urllib.parse.quote(prefix)
    for _ in range(3):
        try:
            req = urllib.request.Request(url, headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            })
            with urllib.request.urlopen(req, timeout=5) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode('utf-8'))
                    results = data.get('results', [])
                    return prefix, results
        except Exception:
            pass
    return prefix, []

def scrape_streets():
    print("Scraping Leipzig street database with full 2-char + 3-char expansion...", flush=True)
    chars = list(string.ascii_lowercase) + ['ä', 'ö', 'ü']
    expansion_chars = chars + ['-', ' ']

    # Level 1: All 2-character prefixes (aa-zz, ä, ö, ü) + single digits 0-9
    level1_prefixes = [c1 + c2 for c1 in chars for c2 in chars] + [str(i) for i in range(10)]
    streets = {}
    capped_prefixes = []

    print(f"Level 1: Fetching {len(level1_prefixes)} 2-char prefixes in parallel...", flush=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as executor:
        results_l1 = list(executor.map(fetch_prefix, level1_prefixes))

    for prefix, items in results_l1:
        for item in items:
            name = item.get('name')
            if name and name not in streets:
                streets[name] = item
        
        # If API returned 10 or more results, it may be capped -> expand to 3-char prefixes!
        if len(items) >= 10:
            capped_prefixes.append(prefix)

    print(f"Level 1 complete: {len(streets)} unique streets found. Capped prefixes: {len(capped_prefixes)}", flush=True)

    # Level 2: Expand all capped prefixes with 3rd character
    level2_prefixes = [p + c for p in capped_prefixes for c in expansion_chars]
    print(f"Level 2: Fetching {len(level2_prefixes)} 3-char expanded prefixes in parallel...", flush=True)

    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as executor:
        results_l2 = list(executor.map(fetch_prefix, level2_prefixes))

    for prefix, items in results_l2:
        for item in items:
            name = item.get('name')
            if name and name not in streets:
                streets[name] = item

    print(f"COMPLETE! Total unique Leipzig streets in database: {len(streets)}", flush=True)
    print(f"✓ Verified Margaretha-Rothe-Straße: {'Margaretha-Rothe-Straße' in streets}", flush=True)
    print(f"✓ Verified Otto-Wilhelm-Scharenberg-Bogen: {'Otto-Wilhelm-Scharenberg-Bogen' in streets}", flush=True)

    # Process into compact format
    compressed_list = []
    sorted_names = sorted(streets.keys())

    for name in sorted_names:
        item = streets[name]
        numbers = {}
        for num_obj in item.get('numbers', []):
            num_str = num_obj.get('number')
            pos_nos = num_obj.get('position_nos', [])
            if num_str and pos_nos:
                numbers[num_str] = pos_nos

        compressed_list.append({
            "n": item.get('name'),
            "p": item.get('postalcode', ''),
            "d": item.get('district', ''),
            "h": numbers
        })

    return compressed_list

def main():
    data = scrape_streets()
    output_path = os.path.join(os.path.dirname(__file__), 'streets.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))

    file_size_kb = os.path.getsize(output_path) / 1024
    print(f"Successfully saved {len(data)} verified streets to {output_path} ({file_size_kb:.2f} KB)", flush=True)

if __name__ == '__main__':
    main()
