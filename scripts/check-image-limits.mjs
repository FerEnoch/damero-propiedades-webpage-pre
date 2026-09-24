#!/usr/bin/env node
/**
 * PRD §9 check 3 — image limits for property listings.
 *
 * The PRD declares five CI checks. Four are already covered by the Astro build
 * and by the Playwright suite; this is the third one, which had no
 * implementation anywhere:
 *
 *   count <= 10 photos per listing, WebP, width <= 1600px, each file <= 300 KB
 *
 * Why it matters: in production an instructed employee publishes a listing by
 * committing a markdown file under `src/content/propiedades/` plus its photos
 * under `public/`. The Astro build validates the frontmatter *shape* but says
 * nothing about the *payload*, so without this check a 6 MB JPEG passes the
 * schema, passes the e2e gate, and is deployed.
 *
 * Zero dependencies on purpose: the pnpm policy is deny-by-default
 * (`allowBuilds`) with `strictDepBuilds: true`, so a new package carrying
 * install scripts would break `pnpm install` outright. Everything here is
 * plain Node.
 *
 * Two independent surfaces are checked:
 *   1. Every photo *referenced* from a listing must exist and be within limits.
 *   2. Every file under `public/propiedades/` must be within limits, even when
 *      unreferenced — an orphan file still ships and still bloats the repo.
 *
 * Exits non-zero on any violation, and also when it cannot read the listings
 * with confidence. It never passes silently.
 */

import { existsSync } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LISTINGS_DIR = path.join(REPO_ROOT, 'src', 'content', 'propiedades');
const PUBLIC_DIR = path.join(REPO_ROOT, 'public');
const PHOTOS_DIR = path.join(PUBLIC_DIR, 'propiedades');

/** PRD §9 check 3 (docs/PRD_Damero_MVP.md §7 for the same numbers). */
const MAX_PHOTOS_PER_LISTING = 10;
const MAX_BYTES = 300 * 1024;
const MAX_WIDTH = 1600;
const REQUIRED_EXT = '.webp';

const violations = [];

function violation(message) {
  violations.push(message);
}

/**
 * Rounds up, so a file just over the cap can never be reported as exactly the
 * cap: rounding to nearest turns 300.001 KB into "300 KB exceeds the 300 KB
 * limit", which reads as a contradiction to the non-technical author this
 * message is written for.
 */
function formatKb(bytes) {
  return `${Math.ceil(bytes / 1024)} KB`;
}

function stripQuotes(value) {
  const trimmed = value.trim();
  const isDouble = trimmed.startsWith('"') && trimmed.endsWith('"');
  const isSingle = trimmed.startsWith("'") && trimmed.endsWith("'");
  return isDouble || isSingle ? trimmed.slice(1, -1) : trimmed;
}

/**
 * Returns the frontmatter lines of a listing, or throws when the document does
 * not have the shape this check knows how to read.
 */
function extractFrontmatter(markdown, file) {
  const lines = markdown.split(/\r?\n/);
  if ((lines[0] ?? '').trim() !== '---') {
    throw new Error(`${file}: frontmatter does not open with "---" on the first line`);
  }
  const close = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
  if (close === -1) {
    throw new Error(`${file}: frontmatter is never closed by "---"`);
  }
  return lines.slice(1, close);
}

/**
 * Reads the `fotos:` entries of one listing. The Astro schema is `.strict()` and
 * already guarantees the block's shape at build time, so a bounded line scan is
 * enough — and it keeps this script dependency-free. Anything it cannot read
 * confidently is an error, never a skip.
 */
function extractPhotoSources(frontmatter, file) {
  const keyIndex = frontmatter.findIndex((line) => /^fotos:\s*(.*)$/.test(line));
  if (keyIndex === -1) {
    throw new Error(`${file}: no top-level "fotos:" key found`);
  }

  const inline = frontmatter[keyIndex].replace(/^fotos:\s*/, '').trim();
  if (inline === '[]') return [];

  if (inline !== '') {
    // Inline flow style, e.g. `fotos: [{ src: "/propiedades/x/a.webp" }]`. The
    // raw `src:` value is returned unvalidated: the path contract is enforced
    // in one place, for both styles, so a wrong path is reported as a violation
    // instead of as an unreadable document.
    const inlineSources = [...inline.matchAll(/src:\s*(?:"([^"]*)"|'([^']*)'|([^,}\]]+))/g)].map(
      (match) => (match[1] ?? match[2] ?? match[3]).trim(),
    );
    if (inlineSources.length === 0) {
      throw new Error(`${file}: "fotos:" has inline content this check cannot read: ${inline}`);
    }
    return inlineSources;
  }

  const block = [];
  for (let index = keyIndex + 1; index < frontmatter.length; index += 1) {
    const line = frontmatter[index];
    if (line.trim() === '') continue;
    if (!/^\s/.test(line)) break; // a dedent ends the block
    block.push(line);
  }

  // A bare `fotos:` (YAML null) is not a valid empty list. The schema rejects
  // it at build time, and this check must not read it as "zero photos, nothing
  // to see" — that would be exactly the silent pass it promises never to make.
  if (block.length === 0) {
    throw new Error(
      `${file}: "fotos:" has no entries — write "fotos: []" for a listing without photos`,
    );
  }

  const sources = [];
  let entries = 0;
  for (const line of block) {
    if (/^\s*-\s/.test(line)) entries += 1;
    const match = line.match(/^\s*(?:-\s*)?src:\s*(.+)$/);
    if (match) sources.push(stripQuotes(match[1]));
  }

  if (entries > 0 && sources.length === 0) {
    throw new Error(`${file}: "fotos:" lists ${entries} entry(ies) but none declares a "src:"`);
  }

  return sources;
}

/**
 * The listing's own `slug:` value. PRD §7, the schema comment and the employee
 * guide all place photos at `public/propiedades/<slug>/`, so this is the folder
 * every `src` of this listing has to be in.
 */
function extractSlug(frontmatter, file) {
  const line = frontmatter.find((entry) => /^slug:\s*(.*)$/.test(entry));
  if (line === undefined) {
    throw new Error(`${file}: no top-level "slug:" key found`);
  }
  const slug = stripQuotes(line.replace(/^slug:\s*/, '')).trim();
  if (slug === '') {
    throw new Error(`${file}: "slug:" is empty`);
  }
  return slug;
}

/**
 * Enforces the documented path contract: a photo must live under
 * `/propiedades/<slug>/`, where `<slug>` is the listing's own slug. Returns
 * `false` when it does not, so the caller can skip the limits that would
 * otherwise report a second, misleading failure for the same mistake.
 */
function hasValidPhotoPath(src, slug, file) {
  const expected = `/propiedades/${slug}/`;
  if (!src.startsWith(expected)) {
    violation(
      `${src} (referenced by ${file}): must live under ${expected} — the guide requires the listing's own slug folder`,
    );
    return false;
  }
  return true;
}

/**
 * Width in pixels of a WebP file, read from its container header only — the
 * image is never decoded. Handles the three chunk layouts the format uses:
 * `VP8 ` (lossy), `VP8L` (lossless) and `VP8X` (extended, alpha/animation).
 * Returns `null` when the header is not a recognisable WebP.
 */
function webpWidth(buffer) {
  if (buffer.length < 16) return null;
  if (buffer.toString('ascii', 0, 4) !== 'RIFF') return null;
  if (buffer.toString('ascii', 8, 12) !== 'WEBP') return null;

  const chunk = buffer.toString('ascii', 12, 16);

  if (chunk === 'VP8 ') {
    // 3-byte frame tag, then the fixed start code 0x9d 0x01 0x2a, then
    // 2 bytes of width (14 bits used) and 2 of height.
    if (buffer.length < 30) return null;
    if (buffer[23] !== 0x9d || buffer[24] !== 0x01 || buffer[25] !== 0x2a) return null;
    return buffer.readUInt16LE(26) & 0x3fff;
  }

  if (chunk === 'VP8L') {
    // 1-byte signature 0x2f, then a little-endian bitstream whose low 14 bits
    // are width - 1.
    if (buffer.length < 25) return null;
    if (buffer[20] !== 0x2f) return null;
    return (buffer.readUInt32LE(21) & 0x3fff) + 1;
  }

  if (chunk === 'VP8X') {
    // 4 bytes of flags and reserved space, then 3 bytes of canvas width - 1.
    if (buffer.length < 30) return null;
    return (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16)) + 1;
  }

  return null;
}

/**
 * Resolves a public-root-absolute `src` (e.g. `/propiedades/x/a.webp`) and
 * reports it when the result escapes `public/`. `path.join` collapses `..`
 * segments, so a crafted `src` could otherwise aim the size and width checks at
 * a file outside the public root. Returns `null` when it escapes.
 */
function resolvePublicPath(src, file) {
  const normalized = src.startsWith('/') ? src.slice(1) : src;
  const resolved = path.join(PUBLIC_DIR, normalized);
  if (resolved !== PUBLIC_DIR && !resolved.startsWith(PUBLIC_DIR + path.sep)) {
    violation(`${src} (referenced by ${file}): resolves outside public/`);
    return null;
  }
  return resolved;
}

/** Recursively lists files, skipping dotfiles such as `.gitkeep`. */
async function walkFiles(dir) {
  const found = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...(await walkFiles(full)));
    } else if (entry.isFile()) {
      found.push(full);
    }
  }
  return found;
}

/** Applies the four limits to one existing file. */
async function inspectPhoto(absPath, context, displayPath) {
  const info = await stat(absPath);

  if (info.size > MAX_BYTES) {
    violation(`${displayPath} (${context}): ${formatKb(info.size)} exceeds the ${MAX_BYTES / 1024} KB limit`);
  }

  const extension = path.extname(absPath).toLowerCase();
  if (extension !== REQUIRED_EXT) {
    violation(`${displayPath} (${context}): must be ${REQUIRED_EXT}, found "${extension || 'no extension'}"`);
    return;
  }

  const width = webpWidth(await readFile(absPath));
  if (width === null) {
    violation(`${displayPath} (${context}): unrecognisable WebP header — the file is not a valid WebP`);
    return;
  }
  if (width > MAX_WIDTH) {
    violation(`${displayPath} (${context}): width ${width}px exceeds the ${MAX_WIDTH}px limit`);
  }
}

async function checkReferencedPhotos() {
  if (!existsSync(LISTINGS_DIR)) {
    throw new Error(`listings directory not found: ${path.relative(REPO_ROOT, LISTINGS_DIR)}`);
  }

  const listingFiles = (await readdir(LISTINGS_DIR)).filter((name) => name.endsWith('.md')).sort();
  if (listingFiles.length === 0) {
    throw new Error(`no listings found under ${path.relative(REPO_ROOT, LISTINGS_DIR)}`);
  }

  let referenced = 0;

  for (const listingFile of listingFiles) {
    const markdown = await readFile(path.join(LISTINGS_DIR, listingFile), 'utf8');
    const frontmatter = extractFrontmatter(markdown, listingFile);
    const slug = extractSlug(frontmatter, listingFile);
    const sources = extractPhotoSources(frontmatter, listingFile);

    if (sources.length > MAX_PHOTOS_PER_LISTING) {
      violation(
        `${listingFile}: ${sources.length} photos referenced, the limit is ${MAX_PHOTOS_PER_LISTING}`,
      );
    }

    for (const src of sources) {
      referenced += 1;
      if (!hasValidPhotoPath(src, slug, listingFile)) continue;

      const absPath = resolvePublicPath(src, listingFile);
      if (absPath === null) continue;

      if (!existsSync(absPath)) {
        violation(`${src} (referenced by ${listingFile}): file does not exist under public/`);
        continue;
      }
      await inspectPhoto(absPath, `referenced by ${listingFile}`, src);
    }
  }

  return { listingFiles: listingFiles.length, referenced };
}

async function checkPhotoDirectory() {
  if (!existsSync(PHOTOS_DIR)) return 0;

  const files = await walkFiles(PHOTOS_DIR);
  for (const absPath of files) {
    const displayPath = `/${path.relative(PUBLIC_DIR, absPath)}`;
    await inspectPhoto(absPath, 'in public/propiedades/', displayPath);
  }
  return files.length;
}

async function main() {
  const { listingFiles, referenced } = await checkReferencedPhotos();
  const onDisk = await checkPhotoDirectory();

  if (violations.length > 0) {
    console.error('\nImage limit violations (PRD §9 check 3):\n');
    for (const entry of violations) {
      console.error(`  - ${entry}`);
    }
    console.error(
      `\n${violations.length} violation(s). Limits: <= ${MAX_PHOTOS_PER_LISTING} photos per listing, ` +
        `${REQUIRED_EXT}, width <= ${MAX_WIDTH}px, each file <= ${MAX_BYTES / 1024} KB.\n`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `Image limits OK — ${listingFiles} listing(s), ${referenced} referenced photo(s), ` +
      `${onDisk} file(s) under public/propiedades/.`,
  );
}

main().catch((error) => {
  console.error(`\nImage limit check could not complete: ${error.message}\n`);
  process.exitCode = 1;
});
