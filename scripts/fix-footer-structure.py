#!/usr/bin/env python3
"""Fix footer DOM: keep reach row, policies, and legal inside footer-content."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Premature footer-content close inserted before reach row
PREMATURE_CLOSE = re.compile(
    r'(</form>\s*</div>\s*)\s*</div>\s*(?=<div class="footer-reach-row">)',
    re.DOTALL,
)

# Duplicate orphan </div> directly before </footer> (only when two closes in a row)
EXTRA_CLOSE = re.compile(
    r'(<div class="footer-legal">.*?</div>\s*)\s*</div>\s*</div>\s*(</footer>)',
    re.DOTALL,
)

# Ensure footer-content closes when reach row lives inside it
ENSURE_CLOSE = re.compile(
    r'(<div class="footer-content">.*?<div class="footer-legal">.*?</div>\s*)(</footer>)',
    re.DOTALL,
)


def fix_file(path: Path) -> bool:
    text = path.read_text(encoding='utf-8')
    if 'class="footer"' not in text and "class='footer'" not in text:
        return False

    original = text
    text = PREMATURE_CLOSE.sub(r'\1', text)
    text = EXTRA_CLOSE.sub(r'\1\2', text)

    if 'class="footer-content"' in text and 'footer-reach-row' in text:
        if not re.search(
            r'<div class="footer-content">.*?<div class="footer-legal">.*?</div>\s*</div>\s*</footer>',
            text,
            re.DOTALL,
        ):
            text = ENSURE_CLOSE.sub(r'\1</div>\n\2', text, count=1)

    if text != original:
        path.write_text(text, encoding='utf-8')
        return True
    return False


def main() -> None:
    changed = 0
    for path in sorted(ROOT.rglob('*.html')):
        if fix_file(path):
            changed += 1
    print(f'Fixed footer structure in {changed} files')


if __name__ == '__main__':
    main()
