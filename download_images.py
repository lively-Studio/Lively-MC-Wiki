#!/usr/bin/env python3
"""Download all images referenced in ALL .md files (all editions) to assets/images/{edition}/."""

import os
import re
import urllib.request
import urllib.error
import time
import hashlib
import glob

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
DOCS_DIR = os.path.join(ROOT_DIR, 'docs')
IMAGES_DIR = os.path.join(ROOT_DIR, 'assets', 'images')

EDITION_MAP = {
    'java':       { 'name': 'Java 版', 'dir': 'java' },
    'bedrock':    { 'name': '基岩版', 'dir': 'bedrock' },
    'china':      { 'name': '中国版', 'dir': 'china' },
    'dungeons':   { 'name': 'Dungeons', 'dir': 'dungeons' },
    'legends':    { 'name': 'Legends', 'dir': 'legends' },
    'earth':      { 'name': 'Earth', 'dir': 'earth' },
    'story-mode': { 'name': 'Story Mode', 'dir': 'story-mode' },
}

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
}

gallery_entries = []

def find_all_md_files():
    """Find all .md files under docs/{edition}/, grouped by edition and subcategory."""
    editions = {}
    for ed_id in EDITION_MAP:
        ed_dir = os.path.join(DOCS_DIR, ed_id)
        if not os.path.isdir(ed_dir):
            continue
        editions[ed_id] = {}
        # Walk all subdirectories under the edition
        for root, dirs, files in os.walk(ed_dir):
            md_files = sorted([f for f in files if f.endswith('.md')])
            if not md_files:
                continue
            rel_dir = os.path.relpath(root, ed_dir)
            if rel_dir == '.':
                category = '_root'
            else:
                category = rel_dir.replace(os.sep, '/')
            full_paths = [os.path.join(root, f) for f in md_files]
            if category not in editions[ed_id]:
                editions[ed_id][category] = []
            editions[ed_id][category].extend(full_paths)
    return editions

def extract_urls(md_file):
    """Extract all image URLs from a markdown file."""
    urls = []
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()
    matches = re.findall(r'!\[.*?\]\((https?://[^\)]+)\)', content)
    urls.extend(matches)
    return urls

def url_to_filename(url):
    """Convert URL to a safe filename based on hash + extension."""
    path = url.split('?')[0]
    ext = os.path.splitext(path)[1] or '.png'
    if ext not in ('.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'):
        ext = '.png'
    hash_str = hashlib.md5(url.encode()).hexdigest()[:8]
    return f"{hash_str}{ext}"

def download_file(url, dest):
    """Download a file with retries."""
    req = urllib.request.Request(url, headers=HEADERS)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = resp.read()
                with open(dest, 'wb') as f:
                    f.write(data)
                return True, len(data)
        except urllib.error.HTTPError as e:
            if attempt < 2:
                time.sleep(1)
                continue
            return False, f"HTTP {e.code}"
        except Exception as e:
            if attempt < 2:
                time.sleep(1)
                continue
            return False, str(e)
    return False, "Max retries exceeded"

def process_md_file(md_file, edition_id, category):
    """Process one md file: extract URLs, download, update markdown."""
    basename = os.path.basename(md_file)
    doc_name = os.path.splitext(basename)[0]
    urls = extract_urls(md_file)
    if not urls:
        return None

    # Image path: assets/images/{edition}/{category}/{doc_name}/hash.png
    img_dir = os.path.join(IMAGES_DIR, edition_id, category, doc_name)
    os.makedirs(img_dir, exist_ok=True)

    # Relative path from .md to image
    # .md is at docs/{edition}/{category}/file.md
    depth_from_edition = category.count('/') + 1 if category != '_root' else 1
    prefix_parts = ['..'] * (depth_from_edition + 1)  # up to docs/, then to assets/
    if category == '_root':
        relative_prefix = '/'.join(prefix_parts) + '/assets/images/' + edition_id + '/' + doc_name
    else:
        relative_prefix = '/'.join(prefix_parts) + '/assets/images/' + edition_id + '/' + category + '/' + doc_name

    url_map = {}
    download_count = 0
    skip_count = 0
    fail_count = 0

    for url in urls:
        filename = url_to_filename(url)
        local_path = os.path.join(img_dir, filename)
        relative_path = f"{relative_prefix}/{filename}"

        url_map[url] = relative_path

        if os.path.exists(local_path):
            skip_count += 1
            continue

        success, result = download_file(url, local_path)
        if success:
            download_count += 1
            print(f"  [OK] {result}B {filename}")
            # Add to gallery
            gallery_entries.append({
                'edition': edition_id,
                'src': f"assets/images/{edition_id}/{category}/{doc_name}/{filename}",
                'name': doc_name.replace('-', ' ').title(),
                'editionName': EDITION_MAP[edition_id]['name']
            })
        else:
            fail_count += 1
            print(f"  [FAIL] {result}: {url[:60]}...")

        time.sleep(0.3)

    # Update markdown file
    if url_map:
        with open(md_file, 'r', encoding='utf-8') as f:
            content = f.read()
        original = content
        for old_url, new_path in url_map.items():
            content = content.replace(old_url, new_path)
        if content != original:
            with open(md_file, 'w', encoding='utf-8') as f:
                f.write(content)

    return {
        'file': doc_name,
        'total': len(urls),
        'downloaded': download_count,
        'skipped': skip_count,
        'failed': fail_count
    }

def generate_gallery_js():
    """Generate gallery entries JS."""
    seen = set()
    unique = []
    for entry in gallery_entries:
        key = entry['src']
        if key not in seen:
            seen.add(key)
            unique.append(entry)

    js_path = os.path.join(ROOT_DIR, 'page', 'gallery-data.js')
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write('// Auto-generated gallery image data\n')
        f.write('var GALLERY_IMAGES = [\n')
        for i, entry in enumerate(unique):
            comma = ',' if i < len(unique) - 1 else ''
            f.write(f'  {{ src: "../{entry["src"]}", edition: "{entry["edition"]}", editionName: "{entry["editionName"]}", name: "{entry["name"]}" }}{comma}\n')
        f.write('];\n')
    print(f"\nGallery data: {len(unique)} images written to page/gallery-data.js")

def main():
    os.makedirs(IMAGES_DIR, exist_ok=True)

    editions = find_all_md_files()
    total_files = sum(len(files) for ed_data in editions.values() for files in ed_data.values())
    print(f"Found {total_files} .md files across {len(editions)} editions\n")

    total_downloaded = 0
    total_skipped = 0
    total_failed = 0
    file_count = 0

    for edition_id, categories in sorted(editions.items()):
        ed_name = EDITION_MAP[edition_id]['name']
        print(f"\n{'='*60}")
        print(f"Edition: {ed_name} ({edition_id})")
        print('='*60)

        for category, files in sorted(categories.items()):
            cat_label = category if category != '_root' else '(root)'
            for md_file in files:
                file_count += 1
                name = os.path.basename(md_file)
                print(f"[{file_count}/{total_files}] [{edition_id}/{cat_label}] {name}")
                result = process_md_file(md_file, edition_id, category)
                if result:
                    total_downloaded += result['downloaded']
                    total_skipped += result['skipped']
                    total_failed += result['failed']

                if file_count % 10 == 0:
                    time.sleep(2)

    generate_gallery_js()

    print(f"\n{'='*60}")
    print(f"ALL DONE!")
    print(f"Files processed: {file_count}")
    print(f"Downloaded: {total_downloaded}, Skipped: {total_skipped}, Failed: {total_failed}")

if __name__ == '__main__':
    main()
