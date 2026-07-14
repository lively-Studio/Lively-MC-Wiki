#!/usr/bin/env python3
"""Download all images referenced in ALL .md files to local images/ directory."""

import os
import re
import urllib.request
import urllib.error
import time
import hashlib
import glob

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
DOCS_DIR = os.path.join(ROOT_DIR, 'docs')
IMAGES_DIR = os.path.join(ROOT_DIR, 'page', 'images')

# All doc categories mapped to their image subdirectory
CATEGORY_IMAGE_MAP = {
    'blocks': 'images/blocks',
    'items': 'images/items',
    'mobs': 'images/mobs',
    'crafting': 'images/crafting',
    'mechanics': 'images/mechanics',
    'versions': 'images/versions',
}

# Common user-agent to avoid 403
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
}

def find_all_md_files():
    """Find all .md files in docs/ (recursively), grouped by category."""
    categories = {}
    # Top-level .md files
    top_files = glob.glob(os.path.join(DOCS_DIR, '*.md'))
    if top_files:
        categories['_root'] = top_files
    # Subdirectories
    for cat in CATEGORY_IMAGE_MAP:
        cat_dir = os.path.join(DOCS_DIR, cat)
        if os.path.isdir(cat_dir):
            files = sorted(glob.glob(os.path.join(cat_dir, '*.md')))
            if files:
                categories[cat] = files
    return categories

def extract_urls(md_file):
    """Extract all image URLs from a markdown file."""
    urls = []
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()
    # Match ![alt](url) patterns
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

def process_md_file(md_file, category, docs_rel_base):
    """Process one md file: extract URLs, download, update markdown."""
    basename = os.path.basename(md_file)
    doc_name = os.path.splitext(basename)[0]
    urls = extract_urls(md_file)
    if not urls:
        return None
    
    # Determine image subdirectory
    if category == '_root':
        img_subdir = 'images'
        img_dir = os.path.join(IMAGES_DIR)
    else:
        img_subdir = CATEGORY_IMAGE_MAP.get(category, f'images/{category}')
        img_dir = os.path.join(ROOT_DIR, 'page', img_subdir)
    
    # Use doc name as subfolder
    doc_img_dir = os.path.join(img_dir, doc_name)
    os.makedirs(doc_img_dir, exist_ok=True)
    
    # Relative path from the .md file to the image
    # .md is in docs/blocks/stone.md, image in page/images/blocks/stone/hash.png
    if category == '_root':
        relative_prefix = f"page/{img_subdir}/{doc_name}"
    else:
        # From docs/category/file.md -> ../page/images/category/file/hash.png
        relative_prefix = f"../page/{img_subdir}/{doc_name}"
    
    url_map = {}
    download_count = 0
    skip_count = 0
    fail_count = 0
    
    for url in urls:
        filename = url_to_filename(url)
        local_path = os.path.join(doc_img_dir, filename)
        relative_path = f"{relative_prefix}/{filename}"
        
        url_map[url] = relative_path
        
        if os.path.exists(local_path):
            skip_count += 1
            continue
        
        success, result = download_file(url, local_path)
        if success:
            download_count += 1
            print(f"  [OK] {result}B {filename} <- {url[:60]}...")
        else:
            fail_count += 1
            print(f"  [FAIL] {result}: {url[:60]}...")
        
        time.sleep(0.3)
    
    # Update markdown file with local paths
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

def main():
    os.makedirs(IMAGES_DIR, exist_ok=True)
    
    categories = find_all_md_files()
    total_files = sum(len(v) for v in categories.values())
    print(f"Found {total_files} .md files across {len(categories)} categories\n")
    
    total_downloaded = 0
    total_skipped = 0
    total_failed = 0
    file_count = 0
    
    for category, files in sorted(categories.items()):
        cat_label = category if category != '_root' else '(top-level)'
        print(f"\n{'='*60}")
        print(f"Category: {cat_label} ({len(files)} files)")
        print('='*60)
        
        for md_file in files:
            file_count += 1
            name = os.path.basename(md_file)
            print(f"[{file_count}/{total_files}] [{cat_label}] {name}")
            result = process_md_file(md_file, category, '')
            if result:
                total_downloaded += result['downloaded']
                total_skipped += result['skipped']
                total_failed += result['failed']
            
            if file_count % 10 == 0:
                time.sleep(2)
    
    print(f"\n{'='*60}")
    print(f"ALL DONE!")
    print(f"Files processed: {file_count}")
    print(f"Downloaded: {total_downloaded}, Skipped: {total_skipped}, Failed: {total_failed}")

if __name__ == '__main__':
    main()
