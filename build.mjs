// Scans Book Notes/*.md, parses YAML frontmatter, emits public/notes.json.
// Zero dependencies. The markdown files are the source of truth.
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const NOTES_DIR = "Book Notes";
const OUT = "public/notes.json";

// Minimal frontmatter parser for the flat key:value + single list shape these notes use.
function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };

  const unquote = (s) => {
    const t = s.trim();
    if (t.length >= 2 && (t[0] === '"' || t[0] === "'") && t[t.length - 1] === t[0])
      return t.slice(1, -1);
    return t;
  };

  const data = {};
  let key = null;
  for (const line of m[1].split("\n")) {
    const listItem = line.match(/^\s*-\s+(.*)$/);
    if (listItem && key) {
      if (!Array.isArray(data[key])) data[key] = [];
      data[key].push(unquote(listItem[1]));
      continue;
    }
    const kv = line.match(/^([A-Za-z0-9_]+):\s?(.*)$/);
    if (kv) {
      key = kv[1];
      const val = kv[2].trim();
      data[key] = val === "" ? "" : unquote(val);
    }
  }
  return { data, body: m[2].trim() };
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function asString(v) {
  return Array.isArray(v) ? v[0] ?? "" : v ?? "";
}

const files = (await readdir(NOTES_DIR)).filter((f) => f.endsWith(".md"));

const notes = [];
for (const file of files) {
  const raw = await readFile(join(NOTES_DIR, file), "utf8");
  const { data, body } = parseFrontmatter(raw);
  const title = asString(data.title) || file.replace(/\.md$/, "");
  notes.push({
    slug: slugify(title) || slugify(file),
    title,
    subtitle: asString(data.subtitle),
    author: asString(data.author) || asString(data.authors),
    category: asString(data.category) || asString(data.categories),
    coverUrl: asString(data.coverUrl),
    status: Array.isArray(data.status) ? data.status[0] : asString(data.status),
    totalPage: asString(data.totalPage),
    publishDate: asString(data.publishDate),
    body,
  });
}

notes.sort((a, b) => a.title.localeCompare(b.title));

await mkdir("public", { recursive: true });
await writeFile(OUT, JSON.stringify({ notes }, null, 2));
console.log(`Wrote ${notes.length} notes to ${OUT}`);
