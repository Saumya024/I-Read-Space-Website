#!/usr/bin/env python3
"""Insert or replace footer contact + social blocks across all HTML pages."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

FOOTER_BLOCK = '''<div class="footer-reach-row">
<div class="footer-reach-section footer-reach-section--connect">
<span class="footer-reach-label">Connect</span>
<div class="footer-reach-icons">
<a href="https://wa.me/919217679635" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" class="footer-reach-icon"><img src="{prefix}icons8-whatsapp-logo-100.png" alt="" loading="lazy"></a>
<a href="mailto:consult@ireadspace.com" aria-label="Email" class="footer-reach-icon"><img src="{prefix}icons8-email-100.png" alt="" loading="lazy"></a>
</div>
</div>
<div class="footer-reach-section footer-reach-section--follow">
<span class="footer-reach-label">Follow Us</span>
<div class="footer-reach-icons">
<a href="https://www.instagram.com/ireadspace?igsh=MmVlbWhzcjFwYmN5&utm_source=qr" target="_blank" rel="noopener noreferrer" aria-label="Instagram" class="footer-reach-icon"><img src="{prefix}icons8-instagram-logo-100.png" alt="" loading="lazy"></a>
<a href="https://www.linkedin.com/in/theonesaumya/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" class="footer-reach-icon"><img src="{prefix}icons8-linkedin-logo-100.png" alt="" loading="lazy"></a>
<a href="https://www.threads.com/@ireadspace" target="_blank" rel="noopener noreferrer" aria-label="Threads" class="footer-reach-icon"><img src="{prefix}icons8-threads-50.png" alt="" loading="lazy"></a>
<a href="https://www.facebook.com/profile.php?id=61590787133182" target="_blank" rel="noopener noreferrer" aria-label="Facebook" class="footer-reach-icon"><img src="{prefix}icons8-facebook-50.png" alt="" loading="lazy"></a>
</div>
</div>
</div>'''

INSERT_AFTER_NEWSLETTER = re.compile(r"(</form>\s*</div>\s*</div>\s*)", re.DOTALL)


def asset_prefix(html_path: Path) -> str:
    rel = html_path.relative_to(ROOT)
    depth = len(rel.parent.parts)
    if depth == 0:
        return "assets/images/"
    return "../" * depth + "assets/images/"


def normalize_block(html_path: Path) -> str:
    return FOOTER_BLOCK.format(prefix=asset_prefix(html_path))


def strip_footer_reach_blocks(text: str) -> str:
    text = re.sub(
        r'<div class="footer-reach-row">.*?footer-reach-section--follow.*?</div>\s*</div>\s*</div>\s*',
        "",
        text,
        flags=re.DOTALL,
    )
    text = re.sub(r'<div class="footer-contact-primary">.*?</div>\s*', "", text, flags=re.DOTALL)
    text = re.sub(r'<div class="footer-reach-divider"[^>]*></div>\s*', "", text)
    text = re.sub(
        r'<div class="footer-reach-secondary">\s*<div class="footer-socials">.*?</div>\s*</div>\s*',
        "",
        text,
        flags=re.DOTALL,
    )
    text = re.sub(r'<div class="footer-socials">.*?</div>\s*', "", text, flags=re.DOTALL)
    return text


def insert_footer_block(text: str, block: str) -> str:
    if 'class="footer-reach-row"' in text:
        return text
    updated, count = INSERT_AFTER_NEWSLETTER.subn(r"\1" + block + "\n ", text, count=1)
    return updated if count else text


def update_file(html_path: Path) -> bool:
    text = html_path.read_text(encoding="utf-8")
    if 'class="footer"' not in text and "class='footer'" not in text:
        return False

    original = text
    text = strip_footer_reach_blocks(text)
    text = insert_footer_block(text, normalize_block(html_path))

    if text == original:
        return False

    html_path.write_text(text, encoding="utf-8")
    return True


def main() -> None:
    changed = 0
    for html_path in ROOT.rglob("*.html"):
        if update_file(html_path):
            changed += 1
            print(f"updated: {html_path.relative_to(ROOT)}")
    print(f"done: {changed} files")


if __name__ == "__main__":
    main()
