"""Build the GitHub Pages hub from standalone studio HTML files."""

import argparse
import json
import re
import shutil
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote


class StudioMetadata(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ""
        self.subject = ""
        self.in_title = False

    def handle_starttag(self, tag, attrs):
        if tag == "title":
            self.in_title = True
        if tag == "meta":
            attributes = dict(attrs)
            if attributes.get("name") == "revision-subject":
                self.subject = (attributes.get("content") or "").strip()

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data


def build(root, output):
    candidates = list(root.iterdir())
    candidates.extend((root / "studios").rglob("*"))
    catalog = []
    output.mkdir(parents=True, exist_ok=True)
    for name in ("index.html", "style.css", "hub.js", "Interactive_Revision_Studio_Mega_Prompt_Engineering.txt"):
        if root != output:
            shutil.copyfile(root / name, output / name)
    for path in sorted(candidates):
        relative = path.relative_to(root)
        if not path.is_file() or path.suffix.lower() != ".html":
            continue
        if len(relative.parts) == 1 and path.stem.casefold() in {"index", "404"}:
            continue
        if any(part.startswith(".") for part in relative.parts):
            continue
        if any(parent.is_symlink() for parent in [path, *path.parents] if parent != root):
            continue
        metadata = StudioMetadata()
        metadata.feed(path.read_text(encoding="utf-8-sig"))
        label = " ".join(re.split(r"[_\-]+", path.stem)).strip()
        subject_name = re.sub(r"^year\s*\d+\s*", "", label, flags=re.I)
        inferred_subject = subject_name.split()[0].capitalize() if subject_name else "Other"
        folder = relative.parts[1] if len(relative.parts) > 2 else ""
        catalog.append({
            "title": " ".join(metadata.title.split()) or label,
            "subject": metadata.subject or folder.replace("-", " ").replace("_", " ").title() or inferred_subject,
            "url": "./" + quote(relative.as_posix(), safe="/"),
        })
        if output != root:
            destination = output / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(path, destination)
    catalog.sort(key=lambda studio: (studio["subject"].casefold(), studio["title"].casefold(), studio["url"]))
    (output / "catalog.js").write_text(
        "window.revisionCatalog = " + json.dumps(catalog, indent=2) + ";\n",
        encoding="utf-8",
    )
    print(f"Indexed {len(catalog)} studio(s) in {output}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path("."))
    options = parser.parse_args()
    build(Path(__file__).resolve().parent, options.output.resolve())
