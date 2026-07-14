#!/usr/bin/env python3
"""Download all images referenced in block .md files to local images/blocks/ directory."""

import os
import re
import urllib.request
import urllib.error
import time
import hashlib

DOCS_DIR = os.path.join(os.path.dirname(__file__), 'docs', 'blocks')
IMAGES_DIR = os.path.join(os.path.dirname(__file__), 'page', 'images', 'blocks')

# Common user-agent to avoid 403
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
}

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
    # Extract extension
    path = url.split('?')[0]
    ext = os.path.splitext(path)[1] or '.png'
    if ext not in ('.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'):
        ext = '.png'
    # Create a short hash of the URL
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

def process_block_file(md_file):
    """Process one block file: extract URLs, download, update markdown."""
    basename = os.path.basename(md_file)
    block_name = os.path.splitext(basename)[0]
    
    urls = extract_urls(md_file)
    if not urls:
        return None
    
    # Create block-specific subdirectory
    block_img_dir = os.path.join(IMAGES_DIR, block_name)
    os.makedirs(block_img_dir, exist_ok=True)
    
    # URL mapping: old URL -> local path
    url_map = {}
    download_count = 0
    skip_count = 0
    fail_count = 0
    
    for url in urls:
        filename = url_to_filename(url)
        local_path = os.path.join(block_img_dir, filename)
        relative_path = f"../images/blocks/{block_name}/{filename}"
        
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
        
        time.sleep(0.3)  # Be polite
    
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
        'block': block_name,
        'total': len(urls),
        'downloaded': download_count,
        'skipped': skip_count,
        'failed': fail_count
    }

def main():
    os.makedirs(IMAGES_DIR, exist_ok=True)
    
    md_files = sorted([
        os.path.join(DOCS_DIR, f) 
        for f in os.listdir(DOCS_DIR) 
        if f.endswith('.md') and f != 'index.md'
    ])
    
    print(f"Found {len(md_files)} block files\n")
    
    total_downloaded = 0
    total_skipped = 0
    total_failed = 0
    
    for i, md_file in enumerate(md_files):
        name = os.path.basename(md_file)
        print(f"[{i+1}/{len(md_files)}] {name}")
        result = process_block_file(md_file)
        if result:
            total_downloaded += result['downloaded']
            total_skipped += result['skipped']
            total_failed += result['failed']
        
        # Don't be too aggressive
        if (i + 1) % 10 == 0:
            time.sleep(2)
    
    print(f"\n{'='*60}")
    print(f"Done! Downloaded: {total_downloaded}, Skipped: {total_skipped}, Failed: {total_failed}")

if __name__ == '__main__':
    main()
