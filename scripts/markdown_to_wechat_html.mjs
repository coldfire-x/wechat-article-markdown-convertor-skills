#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { listStylePresets, resolveStyleConfig } from './style_presets.mjs';

const ALLOWED_TAGS = new Set([
  'section',
  'p',
  'br',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'ul',
  'ol',
  'li',
  'a',
  'img',
  'strong',
  'em',
  'code',
  'pre',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'hr',
  'span',
  'del',
  'figure',
  'figcaption',
]);

const VOID_TAGS = new Set(['br', 'img', 'hr']);
const TAG_ALIAS = {
  article: 'section',
  main: 'section',
  div: 'section',
};

const DISALLOWED_BLOCK_TAGS = [
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'video',
  'audio',
  'svg',
  'canvas',
  'form',
  'input',
  'button',
  'textarea',
  'select',
];

const SAFE_STYLE_PROPS = new Set([
  'background',
  'background-color',
  'border',
  'border-color',
  'border-bottom',
  'border-left',
  'border-radius',
  'border-right',
  'border-top',
  'border-collapse',
  'box-sizing',
  'color',
  'display',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'height',
  'letter-spacing',
  'line-height',
  'margin',
  'margin-bottom',
  'margin-left',
  'margin-right',
  'margin-top',
  'max-width',
  'overflow-x',
  'padding',
  'padding-bottom',
  'padding-left',
  'padding-right',
  'padding-top',
  'table-layout',
  'text-align',
  'text-indent',
  'text-decoration',
  'vertical-align',
  'white-space',
  'width',
  'word-break',
  'word-wrap',
]);

function normalizeLineEndings(text) {
  return String(text ?? '').replace(/\r\n?/g, '\n');
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function parseSimpleFrontmatter(yamlText) {
  const data = {};
  const lines = normalizeLineEndings(yamlText).split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const match = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!match) {
      continue;
    }
    const key = match[1];
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (/^(true|false)$/i.test(value)) {
      data[key] = /^true$/i.test(value);
      continue;
    }
    if (/^-?\d+$/.test(value)) {
      data[key] = Number(value);
      continue;
    }
    data[key] = value;
  }
  return data;
}

export function splitFrontmatter(markdown) {
  const normalized = normalizeLineEndings(markdown);
  if (!normalized.startsWith('---\n')) {
    return { frontmatter: {}, body: normalized };
  }
  const closeMarker = normalized.indexOf('\n---\n', 4);
  if (closeMarker === -1) {
    return { frontmatter: {}, body: normalized };
  }
  const yamlBlock = normalized.slice(4, closeMarker);
  const body = normalized.slice(closeMarker + '\n---\n'.length);
  return {
    frontmatter: parseSimpleFrontmatter(yamlBlock),
    body,
  };
}

function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll('\n', ' ');
}

function applyInlineTextStyles(escapedText) {
  return String(escapedText ?? '')
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_\n]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    .replace(/_([^_\n]+)_/g, '<em>$1</em>')
    .replace(
      /~~([^~\n]+)~~/g,
      '<span style="text-decoration:line-through;">$1</span>'
    );
}

function renderInline(text) {
  const codeTokens = [];
  const htmlTokens = [];
  let working = String(text ?? '');

  working = working.replace(/`([^`\n]+)`/g, (_, code) => {
    const index = codeTokens.push(code) - 1;
    return `@@CODEPLACEHOLDER${index}@@`;
  });

  working = working.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+(?:"([^"]+)"|'([^']+)'))?\)/g,
    (_, alt, src, titleDouble, titleSingle) => {
      const title = titleDouble ?? titleSingle;
      const titleAttr = title ? ` title="${escapeAttr(title)}"` : '';
      const html = `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}"${titleAttr}>`;
      const index = htmlTokens.push(html) - 1;
      return `@@HTMLPLACEHOLDER${index}@@`;
    }
  );

  working = working.replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+(?:"([^"]+)"|'([^']+)'))?\)/g,
    (_, label, href, titleDouble, titleSingle) => {
      const title = titleDouble ?? titleSingle;
      const titleAttr = title ? ` title="${escapeAttr(title)}"` : '';
      const labelHtml = applyInlineTextStyles(escapeHtml(label));
      const html = `<a href="${escapeAttr(href)}"${titleAttr}>${labelHtml}</a>`;
      const index = htmlTokens.push(html) - 1;
      return `@@HTMLPLACEHOLDER${index}@@`;
    }
  );

  working = escapeHtml(working);
  working = applyInlineTextStyles(working);

  working = working.replace(/@@HTMLPLACEHOLDER(\d+)@@/g, (_, indexText) => {
    const index = Number(indexText);
    return htmlTokens[index] ?? '';
  });

  working = working.replace(/@@CODEPLACEHOLDER(\d+)@@/g, (_, indexText) => {
    const index = Number(indexText);
    return `<code>${escapeHtml(codeTokens[index] ?? '')}</code>`;
  });

  return working;
}

function isUnorderedListItem(line) {
  return /^\s*[-*+]\s+/.test(line);
}

function isOrderedListItem(line) {
  return /^\s*\d+\.\s+/.test(line);
}

function isBlockStart(line) {
  return (
    /^#{1,6}\s+/.test(line) ||
    /^\s*(?:`{3,}|~{3,})/.test(line) ||
    /^\s*>\s?/.test(line) ||
    isUnorderedListItem(line) ||
    isOrderedListItem(line) ||
    /^(\*\s*\*\s*\*|-{3,}|_{3,})\s*$/.test(line)
  );
}

function parseFenceOpening(line) {
  const match = String(line ?? '').match(/^\s*([`~]{3,})(.*)$/);
  if (!match) {
    return null;
  }
  const marker = match[1];
  const markerChar = marker[0];
  const markerLength = marker.length;
  const infoString = String(match[2] ?? '').trim();
  const language = infoString.split(/\s+/).filter(Boolean)[0] ?? '';
  return {
    markerChar,
    markerLength,
    language,
  };
}

function isFenceClosing(line, fence) {
  const match = String(line ?? '').match(/^\s*([`~]{3,})\s*$/);
  if (!match || !fence) {
    return false;
  }
  const marker = match[1];
  return marker[0] === fence.markerChar && marker.length >= fence.markerLength;
}

function parseTableLine(line) {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map((cell) => cell.trim());
}

function looksLikeTableDivider(line) {
  return /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(line);
}

function basicMarkdownToHtml(markdown) {
  const lines = normalizeLineEndings(markdown).split('\n');
  const blocks = [];

  for (let i = 0; i < lines.length; ) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      blocks.push(`<h${level}>${renderInline(headingMatch[2].trim())}</h${level}>`);
      i += 1;
      continue;
    }

    const fence = parseFenceOpening(line);
    if (fence) {
      const lang = fence.language;
      const codeLines = [];
      i += 1;
      while (i < lines.length && !isFenceClosing(lines[i], fence)) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) {
        i += 1;
      }
      const classAttr = lang ? ` class="language-${escapeAttr(lang)}"` : '';
      blocks.push(
        `<pre><code${classAttr}>${escapeHtml(codeLines.join('\n'))}</code></pre>`
      );
      continue;
    }

    if (/^(\*\s*\*\s*\*|-{3,}|_{3,})\s*$/.test(line)) {
      blocks.push('<hr>');
      i += 1;
      continue;
    }

    if (
      i + 1 < lines.length &&
      line.includes('|') &&
      lines[i + 1].includes('|') &&
      looksLikeTableDivider(lines[i + 1])
    ) {
      const header = parseTableLine(line);
      i += 2;
      const bodyRows = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        bodyRows.push(parseTableLine(lines[i]));
        i += 1;
      }
      const headHtml = `<thead><tr>${header
        .map((cell) => `<th>${renderInline(cell)}</th>`)
        .join('')}</tr></thead>`;
      const bodyHtml = bodyRows.length
        ? `<tbody>${bodyRows
            .map(
              (row) =>
                `<tr>${row
                  .map((cell) => `<td>${renderInline(cell)}</td>`)
                  .join('')}</tr>`
            )
            .join('')}</tbody>`
        : '';
      blocks.push(`<table>${headHtml}${bodyHtml}</table>`);
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const quoteLines = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^\s*>\s?/, ''));
        i += 1;
      }
      const quoteText = quoteLines.join('\n');
      const paragraphs = quoteText
        .split(/\n{2,}/)
        .map((chunk) => chunk.replace(/\n+/g, ' ').trim())
        .filter(Boolean)
        .map((chunk) => `<p>${renderInline(chunk)}</p>`)
        .join('');
      blocks.push(`<blockquote>${paragraphs}</blockquote>`);
      continue;
    }

    if (isUnorderedListItem(line) || isOrderedListItem(line)) {
      const ordered = isOrderedListItem(line);
      const items = [];
      while (
        i < lines.length &&
        (ordered ? isOrderedListItem(lines[i]) : isUnorderedListItem(lines[i]))
      ) {
        const itemText = ordered
          ? lines[i].replace(/^\s*\d+\.\s+/, '')
          : lines[i].replace(/^\s*[-*+]\s+/, '');
        items.push(`<li>${renderInline(itemText.trim())}</li>`);
        i += 1;
      }
      blocks.push(`<${ordered ? 'ol' : 'ul'}>${items.join('')}</${ordered ? 'ol' : 'ul'}>`);
      continue;
    }

    const paragraphLines = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) {
      paragraphLines.push(lines[i].trim());
      i += 1;
    }
    blocks.push(`<p>${renderInline(paragraphLines.join(' '))}</p>`);
  }

  return blocks.join('\n');
}

async function renderMarkdown(markdown) {
  try {
    const markedModule = await import('marked');
    const marked = markedModule.marked ?? markedModule.default ?? markedModule;
    if (marked && typeof marked.setOptions === 'function') {
      marked.setOptions({
        gfm: true,
        breaks: false,
        mangle: false,
        headerIds: false,
      });
    }
    const output =
      marked && typeof marked.parse === 'function'
        ? await marked.parse(markdown)
        : '';
    if (typeof output === 'string' && output.trim()) {
      return output;
    }
  } catch {
    // Fallback to built-in parser.
  }
  return basicMarkdownToHtml(markdown);
}

function parseAttributes(attrText) {
  const attrs = {};
  const pattern =
    /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let match = pattern.exec(attrText);
  while (match) {
    const key = String(match[1] ?? '').toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    attrs[key] = value;
    match = pattern.exec(attrText);
  }
  return attrs;
}

function sanitizeStyle(styleText) {
  const chunks = String(styleText ?? '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);
  const safeChunks = [];
  for (const chunk of chunks) {
    const sep = chunk.indexOf(':');
    if (sep === -1) {
      continue;
    }
    const key = chunk.slice(0, sep).trim().toLowerCase();
    const value = chunk.slice(sep + 1).trim();
    if (!SAFE_STYLE_PROPS.has(key)) {
      continue;
    }
    if (/expression\s*\(|javascript:/i.test(value)) {
      continue;
    }
    safeChunks.push(`${key}:${value}`);
  }
  return safeChunks.join(';');
}

function mergeStyles(styles) {
  return styles
    .map((item) => sanitizeStyle(item))
    .filter(Boolean)
    .join(';');
}

function isSafeHref(url) {
  const trimmed = String(url ?? '').trim();
  return (
    trimmed.startsWith('#') ||
    /^https?:\/\//i.test(trimmed) ||
    /^mailto:/i.test(trimmed) ||
    /^tel:/i.test(trimmed)
  );
}

function isSafeSrc(url) {
  const trimmed = String(url ?? '').trim();
  return (
    /^https?:\/\//i.test(trimmed) ||
    /^data:image\//i.test(trimmed) ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../')
  );
}

function transformTag(fullMatch, rawTagName, rawAttrs, styleConfig) {
  const isClosing = /^<\s*\//.test(fullMatch);
  const sourceTag = String(rawTagName ?? '').toLowerCase();
  const tag = TAG_ALIAS[sourceTag] ?? sourceTag;

  if (!ALLOWED_TAGS.has(tag)) {
    return '';
  }

  if (isClosing) {
    return VOID_TAGS.has(tag) ? '' : `</${tag}>`;
  }

  const attrs = parseAttributes(rawAttrs);
  const allowedAttrs = {};
  const styleParts = [styleConfig.tagStyles[tag] ?? ''];

  const classNames = String(attrs.class ?? '')
    .split(/\s+/)
    .map((name) => name.trim())
    .filter(Boolean);
  for (const className of classNames) {
    if (styleConfig.classStyles[className]) {
      styleParts.push(styleConfig.classStyles[className]);
    }
  }
  if (attrs.style) {
    styleParts.push(attrs.style);
  }

  if (tag === 'a') {
    if (attrs.href && isSafeHref(attrs.href)) {
      allowedAttrs.href = attrs.href;
      allowedAttrs.rel = 'noopener noreferrer';
    }
    if (attrs.title) {
      allowedAttrs.title = attrs.title;
    }
  }

  if (tag === 'img') {
    if (!attrs.src || !isSafeSrc(attrs.src)) {
      return '';
    }
    allowedAttrs.src = attrs.src;
    if (attrs.alt) {
      allowedAttrs.alt = attrs.alt;
    }
    if (attrs.title) {
      allowedAttrs.title = attrs.title;
    }
  }

  if (tag === 'th' || tag === 'td') {
    if (attrs.colspan && /^\d+$/.test(attrs.colspan)) {
      allowedAttrs.colspan = attrs.colspan;
    }
    if (attrs.rowspan && /^\d+$/.test(attrs.rowspan)) {
      allowedAttrs.rowspan = attrs.rowspan;
    }
    if (attrs.align) {
      allowedAttrs.align = attrs.align;
    }
  }

  if (/^h[1-6]$/.test(tag) && attrs.id) {
    allowedAttrs.id = attrs.id;
  }

  const style = mergeStyles(styleParts);
  if (style) {
    allowedAttrs.style = style;
  }

  const attrText = Object.entries(allowedAttrs)
    .map(([key, value]) => ` ${key}="${escapeAttr(value)}"`)
    .join('');

  return VOID_TAGS.has(tag) ? `<${tag}${attrText}>` : `<${tag}${attrText}>`;
}

function stripDisallowedBlocks(html) {
  let output = String(html ?? '');
  for (const tag of DISALLOWED_BLOCK_TAGS) {
    const pairPattern = new RegExp(
      `<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}\\s*>`,
      'gi'
    );
    output = output.replace(pairPattern, '');
    const selfPattern = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
    output = output.replace(selfPattern, '');
  }
  output = output.replace(/<!--[\s\S]*?-->/g, '');
  return output;
}

function normalizeHtmlSpacing(html) {
  return String(html ?? '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+\n/g, '\n')
    .trim();
}

function preserveIndentation(line) {
  const expandedTabs = String(line ?? '').replace(/\t/g, '    ');
  const leadingSpaces = expandedTabs.match(/^ +/)?.[0] ?? '';
  if (!leadingSpaces) {
    return expandedTabs;
  }
  const leading = leadingSpaces.replace(/ /g, '&nbsp;');
  return `${leading}${expandedTabs.slice(leadingSpaces.length)}`;
}

function normalizeCodeBlocksForWechat(html) {
  return String(html ?? '').replace(
    /<pre\b([^>]*)>\s*<code\b([^>]*)>([\s\S]*?)<\/code>\s*<\/pre>/gi,
    (fullMatch, preAttrs, codeAttrs, rawCode) => {
      const codeText = String(rawCode ?? '');
      if (!codeText) {
        return fullMatch;
      }
      if (/<br\s*\/?>/i.test(codeText)) {
        return fullMatch;
      }

      const normalized = codeText.replace(/\r\n?/g, '\n');
      const lines = normalized.split('\n').map((line) => preserveIndentation(line));
      const withLineBreaks = lines.join('<br>');
      return `<pre${preAttrs}><code${codeAttrs}>${withLineBreaks}</code></pre>`;
    }
  );
}

function transformHtmlForWechat(html, styleConfig) {
  const cleaned = stripDisallowedBlocks(html);
  const rewritten = cleaned.replace(
    /<\s*\/?\s*([a-zA-Z0-9:_-]+)([^>]*)>/g,
    (full, tagName, attrs) => transformTag(full, tagName, attrs, styleConfig)
  );
  const normalizedCodeBlocks = normalizeCodeBlocksForWechat(rewritten);
  return normalizeHtmlSpacing(normalizedCodeBlocks);
}

export function extractImageSources(html) {
  const result = [];
  const pattern = /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let match = pattern.exec(String(html ?? ''));
  while (match) {
    result.push(match[1]);
    match = pattern.exec(String(html ?? ''));
  }
  return result;
}

export function replaceImageSources(html, mapping) {
  const map =
    mapping instanceof Map
      ? mapping
      : new Map(Object.entries(mapping ?? {}).map(([k, v]) => [k, v]));
  return String(html ?? '').replace(
    /(<img\b[^>]*\bsrc\s*=\s*["'])([^"']+)(["'][^>]*>)/gi,
    (full, prefix, src, suffix) => {
      if (!map.has(src)) {
        return full;
      }
      return `${prefix}${escapeAttr(String(map.get(src)))}${suffix}`;
    }
  );
}

function parseStyleOverride(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return undefined;
  }
  return input;
}

function resolveStyle(options = {}) {
  return resolveStyleConfig({
    presetName:
      typeof options.stylePreset === 'string' ? options.stylePreset : undefined,
    override: parseStyleOverride(options.styleOverride),
  });
}

export async function renderMarkdownToWechatHtml(markdown, options = {}) {
  const styleConfig = resolveStyle(options);
  const { body } = splitFrontmatter(markdown);
  const rawHtml = await renderMarkdown(body);
  let wechatHtml = transformHtmlForWechat(rawHtml, styleConfig);
  if (options.imageMap) {
    wechatHtml = replaceImageSources(wechatHtml, options.imageMap);
  }
  if (options.wrapRoot === false) {
    return wechatHtml;
  }
  return `<section style="${escapeAttr(styleConfig.rootStyle)}">\n${wechatHtml}\n</section>`;
}

function printStylePresets() {
  const lines = listStylePresets().map(
    (item) => `- ${item.name}: ${item.description}`
  );
  console.log(lines.join('\n'));
}

function printUsage() {
  console.log(`Usage:
  node scripts/markdown_to_wechat_html.mjs --input <file.md> [--output <file.html>] [--image-map <map.json>] [--style <name>] [--style-file <style.json>] [--no-root]

Options:
  --input         Markdown file path (required)
  --output        Output HTML file path (optional, stdout if omitted)
  --image-map     JSON file path: {"oldSrc":"newSrc"} for image replacement
  --style         Preset style (formal, business, simple, modern)
  --style-file    JSON style override file
  --list-styles   Print available style presets and exit
  --no-root       Do not wrap with root <section>`);
}

async function loadImageMap(pathValue) {
  if (!pathValue) {
    return undefined;
  }
  const text = await fs.readFile(pathValue, 'utf8');
  return JSON.parse(text);
}

async function loadStyleOverride(pathValue) {
  if (!pathValue) {
    return undefined;
  }
  const text = await fs.readFile(path.resolve(String(pathValue)), 'utf8');
  const json = JSON.parse(text);
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    throw new Error('style-file must be a JSON object');
  }
  return json;
}

async function runCli() {
  const args = parseArgs(process.argv.slice(2));
  if (args['list-styles']) {
    printStylePresets();
    return;
  }
  if (args.help || args.h || !args.input) {
    printUsage();
    process.exit(args.input ? 0 : 1);
  }

  const inputPath = path.resolve(String(args.input));
  const markdown = await fs.readFile(inputPath, 'utf8');
  const imageMap = await loadImageMap(args['image-map']);
  const styleOverride = await loadStyleOverride(args['style-file']);
  const wrapRoot = !args['no-root'];

  const html = await renderMarkdownToWechatHtml(markdown, {
    imageMap,
    stylePreset: args.style,
    styleOverride,
    wrapRoot,
  });

  if (args.output) {
    const outputPath = path.resolve(String(args.output));
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, html, 'utf8');
    console.log(outputPath);
    return;
  }

  process.stdout.write(html);
}

if (pathToFileURL(process.argv[1] ?? '').href === import.meta.url) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
