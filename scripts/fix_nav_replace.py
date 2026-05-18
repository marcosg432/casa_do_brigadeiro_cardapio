"""Corrige nav em pages/*.html: substitui o <ul class="nav-menu">…</ul> externo (conta nested <ul>)."""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent / "pages"
SNIP = pathlib.Path(__file__).resolve().parent / "nav-pages-snippet.html"


def replace_outer_nav_menu(html: str, snippet: str) -> str | None:
    key = '<ul class="nav-menu">'
    start = html.find(key)
    if start == -1:
        return None
    depth = 0
    i = start
    while i < len(html):
        if html.startswith("<ul", i) and (i + 3 < len(html) and html[i + 3] in " \t\n>"):
            depth += 1
            i = html.find(">", i) + 1
            continue
        if html.startswith("</ul>", i):
            depth -= 1
            end = i + len("</ul>")
            i = end
            if depth == 0:
                return html[:start] + snippet.rstrip() + "\n" + html[end:]
            continue
        i += 1
    return None


def main() -> None:
    snippet = SNIP.read_text(encoding="utf-8")
    for f in sorted(ROOT.glob("*.html")):
        t = f.read_text(encoding="utf-8")
        t2 = replace_outer_nav_menu(t, snippet)
        if t2 is None:
            print("SKIP", f.name)
            continue
        if t2 != t:
            f.write_text(t2, encoding="utf-8")
            print("FIXED", f.name)


if __name__ == "__main__":
    main()
