#!/usr/bin/env python3
"""Replace flat Resources nav links with dropdown in header nav across sub-pages."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

NAV_PATTERN = re.compile(
    r'(<nav class="nav" id="nav">)(.*?)(</nav>)',
    re.DOTALL,
)

FLAT_RESOURCES = re.compile(
    r'<a href="(?P<prefix>(?:\.\./)+)insights\.html">Insights</a>\s*'
    r'<a href="(?P=prefix)alternative-healing-practices\.html">Healing</a>'
    r'<a href="(?P=prefix)conscious-living\.html">Conscious Living</a>\s*'
    r'<a href="(?P=prefix)reset-now\.html">Reset</a>',
)

INLINE_DROPDOWN_COMMENT = re.compile(
    r'\s*<!-- Navigation Dropdown Script -->\s*<script>.*?querySelectorAll\([\'"]\.nav-dropdown[\'"]\).*?</script>',
    re.DOTALL,
)

INLINE_DROPDOWN_BARE = re.compile(
    r'<script>\s*document\.addEventListener\([\'"]DOMContentLoaded[\'"], function\(\) \{\s*'
    r'const dropdowns = document\.querySelectorAll\([\'"]\.nav-dropdown[\'"]\);.*?\}\);\s*</script>',
    re.DOTALL,
)


def make_dropdown(prefix: str, compact: bool) -> str:
    links = (
        f'<a href="{prefix}insights.html">Insights</a>'
        f'<a href="{prefix}alternative-healing-practices.html">Healing</a>'
        f'<a href="{prefix}conscious-living.html">Conscious Living</a>'
        f'<a href="{prefix}reset-now.html">Reset</a>'
    )
    if compact:
        return (
            '<div class="nav-dropdown">'
            '<button class="nav-dropdown-toggle" aria-expanded="false">Resources</button>'
            f'<div class="nav-dropdown-menu">{links}</div>'
            '</div>'
        )
    return (
        '      <div class="nav-dropdown">\n'
        '        <button class="nav-dropdown-toggle" aria-expanded="false">Resources</button>\n'
        '        <div class="nav-dropdown-menu">\n'
        f'          <a href="{prefix}insights.html">Insights</a>\n'
        f'          <a href="{prefix}alternative-healing-practices.html">Healing</a>'
        f'<a href="{prefix}conscious-living.html">Conscious Living</a>\n'
        f'          <a href="{prefix}reset-now.html">Reset</a>\n'
        '        </div>\n'
        '      </div>'
    )


def process_nav(nav_inner: str) -> tuple[str, bool]:
    if 'nav-dropdown' in nav_inner:
        return nav_inner, False

    match = FLAT_RESOURCES.search(nav_inner)
    if not match:
        return nav_inner, False

    prefix = match.group('prefix')
    compact = '\n' not in match.group(0)
    dropdown = make_dropdown(prefix, compact)
    new_inner = nav_inner[: match.start()] + dropdown + nav_inner[match.end() :]
    return new_inner, True


def process_file(path: Path) -> dict:
    text = path.read_text(encoding='utf-8')
    original = text
    nav_updated = False
    script_removed = False

    def nav_replacer(m: re.Match) -> str:
        nonlocal nav_updated
        open_tag, inner, close_tag = m.group(1), m.group(2), m.group(3)
        new_inner, changed = process_nav(inner)
        if changed:
            nav_updated = True
        return open_tag + new_inner + close_tag

    text = NAV_PATTERN.sub(nav_replacer, text)

    new_text, n = INLINE_DROPDOWN_COMMENT.subn('', text)
    if n:
        script_removed = True
        text = new_text

    new_text, n = INLINE_DROPDOWN_BARE.subn('', text)
    if n:
        script_removed = True
        text = new_text

    text = text.replace('mobile-menu.js?v=17', 'mobile-menu.js?v=18')

    if text != original:
        path.write_text(text, encoding='utf-8')

    return {
        'path': str(path.relative_to(ROOT)),
        'nav_updated': nav_updated,
        'script_removed': script_removed,
        'changed': text != original,
    }


def main() -> None:
    html_files = sorted(ROOT.rglob('*.html'))
    nav_count = 0
    script_count = 0
    changed_count = 0
    skipped = []

    for path in html_files:
        result = process_file(path)
        if result['changed']:
            changed_count += 1
        if result['nav_updated']:
            nav_count += 1
        if result['script_removed']:
            script_count += 1

    remaining = []
    for path in html_files:
        content = path.read_text(encoding='utf-8')
        for m in NAV_PATTERN.finditer(content):
            if 'nav-dropdown' not in m.group(2) and FLAT_RESOURCES.search(m.group(2)):
                remaining.append(str(path.relative_to(ROOT)))

    print(f'Files changed: {changed_count}')
    print(f'Header nav dropdowns added: {nav_count}')
    print(f'Inline dropdown scripts removed: {script_count}')
    if remaining:
        print(f'Remaining flat header nav ({len(remaining)}):')
        for item in remaining[:20]:
            print(f'  - {item}')
        if len(remaining) > 20:
            print(f'  ... and {len(remaining) - 20} more')


if __name__ == '__main__':
    main()
