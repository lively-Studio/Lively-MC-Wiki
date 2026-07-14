#!/usr/bin/env python3
"""
update_versions.py

从 versions.json 读取最新版本信息，扫描所有 .md 文件中的占位符并替换。
占位符格式:
  {{JE_VERSION}}  - Java 版最新版本号
  {{BE_VERSION}}  - 基岩版最新版本号
  {{JE_NAME}}     - Java 版最新更新名称 (英文)
  {{BE_NAME}}     - 基岩版最新更新名称 (英文)
  {{JE_NAME_ZH}}  - Java 版最新更新名称 (中文)
  {{BE_NAME_ZH}}  - 基岩版最新更新名称 (中文)
  {{JE_DATE}}     - Java 版发布日期
  {{BE_DATE}}     - 基岩版发布日期

用法:
  python3 update_versions.py              # 扫描所有 .md 文件并替换占位符
  python3 update_versions.py --check      # 仅检查哪些文件有占位符，不修改
  python3 update_versions.py --dry-run    # 预览替换结果，不修改文件
"""

import json
import os
import re
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent.absolute()
VERSIONS_FILE = SCRIPT_DIR / "versions.json"
DOCS_DIR = SCRIPT_DIR / "docs"

PLACEHOLDERS = [
    "JE_VERSION", "BE_VERSION", "JE_NAME", "BE_NAME",
    "JE_NAME_ZH", "BE_NAME_ZH", "JE_DATE", "BE_DATE"
]


def load_versions():
    with open(VERSIONS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    latest = data.get("latest", {})
    return {
        "JE_VERSION": latest.get("java", "26.2"),
        "BE_VERSION": latest.get("bedrock", "26.30"),
        "JE_NAME": latest.get("java_name", "Chaos Cubed"),
        "BE_NAME": latest.get("bedrock_name", "Chaos Cubed"),
        "JE_NAME_ZH": latest.get("java_name_zh", "混沌立方"),
        "BE_NAME_ZH": latest.get("bedrock_name_zh", "混沌立方"),
        "JE_DATE": latest.get("java_date", "2026-06-16"),
        "BE_DATE": latest.get("bedrock_date", "2026-06-16"),
    }


def find_md_files():
    """Recursively find all .md files under docs/"""
    md_files = []
    for root, dirs, files in os.walk(DOCS_DIR):
        for f in files:
            if f.endswith(".md"):
                md_files.append(Path(root) / f)
    return sorted(md_files)


def process_file(filepath, replacements, dry_run=False, check_only=False):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    placeholder_pattern = re.compile(r'\{\{(' + '|'.join(PLACEHOLDERS) + r')\}\}')
    matches = placeholder_pattern.findall(content)

    if not matches:
        return 0

    if check_only:
        return len(set(matches))

    new_content = content
    for key, value in replacements.items():
        new_content = new_content.replace(f"{{{{{key}}}}}", value)

    if dry_run:
        # Show diff-like output
        changes = []
        for key, value in replacements.items():
            old = f"{{{{{key}}}}}"
            if old in content:
                count = content.count(old)
                changes.append(f"  {old} -> {value} ({count}处)")
        print(f"\n[{filepath.relative_to(SCRIPT_DIR)}]")
        for c in changes:
            print(c)
        return len(matches)

    # Write back
    if new_content != content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        placeholder_count = len(placeholder_pattern.findall(content))
        print(f"  ✓ {filepath.relative_to(SCRIPT_DIR)} ({placeholder_count}处替换)")
    return len(matches)


def main():
    check_only = "--check" in sys.argv
    dry_run = "--dry-run" in sys.argv

    print("=" * 60)
    print("  Minecraft Wiki - 版本号占位符更新脚本")
    print("=" * 60)

    # Load version data
    try:
        replacements = load_versions()
    except FileNotFoundError:
        print(f"错误: 找不到 {VERSIONS_FILE}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"错误: {VERSIONS_FILE} 格式无效: {e}")
        sys.exit(1)

    print(f"\n最新版本信息:")
    print(f"  Java 版:  {replacements['JE_VERSION']} ({replacements['JE_NAME_ZH']})")
    print(f"  基岩版:  {replacements['BE_VERSION']} ({replacements['BE_NAME_ZH']})")
    print(f"  日期:    {replacements['JE_DATE']}")

    # Find all .md files
    md_files = find_md_files()
    print(f"\n扫描目录: {DOCS_DIR}")
    print(f"找到 {len(md_files)} 个 .md 文件")

    if check_only:
        print("\n[检查模式] 仅列出包含占位符的文件:\n")

    # Process each file
    total_files = 0
    total_replacements = 0
    for filepath in md_files:
        count = process_file(filepath, replacements, dry_run=dry_run, check_only=check_only)
        if count > 0:
            total_files += 1
            total_replacements += count

    # Summary
    print(f"\n" + "=" * 60)
    if check_only:
        print(f"  检查完成: {total_files} 个文件包含占位符 ({total_replacements}处)")
    elif dry_run:
        print(f"  预览完成: {total_files} 个文件将被修改 ({total_replacements}处)")
        print(f"  如需实际修改，请运行: python3 update_versions.py")
    else:
        if total_files > 0:
            print(f"  更新完成: {total_files} 个文件已修改 ({total_replacements}处替换)")
        else:
            print(f"  无需更新: 所有文件已是最新版本")
    print("=" * 60)


if __name__ == "__main__":
    main()
