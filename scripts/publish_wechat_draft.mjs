#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  extractImageSources,
  renderMarkdownToWechatHtml,
  replaceImageSources,
  splitFrontmatter,
} from './markdown_to_wechat_html.mjs';
import { listStylePresets } from './style_presets.mjs';

const WECHAT_API = {
  stableToken: 'https://api.weixin.qq.com/cgi-bin/stable_token',
  token: 'https://api.weixin.qq.com/cgi-bin/token',
  uploadImageInArticle: 'https://api.weixin.qq.com/cgi-bin/media/uploadimg',
  uploadMaterial: 'https://api.weixin.qq.com/cgi-bin/material/add_material',
  addDraft: 'https://api.weixin.qq.com/cgi-bin/draft/add',
};

const WECHAT_HOST_HINTS = [
  'mmbiz.qpic.cn',
  'mmbiz.qlogo.cn',
  'mp.weixin.qq.com',
];

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

function readIntFlag(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (value === true) {
    return 1;
  }
  if (value === false) {
    return 0;
  }
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return undefined;
  }
  return numberValue > 0 ? 1 : 0;
}

function toStringValue(value) {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value);
}

function ensureRequired(value, fieldName) {
  if (!String(value ?? '').trim()) {
    throw new Error(`Missing required field: ${fieldName}`);
  }
}

function normalizeContentSourceUrl(value) {
  const raw = toStringValue(value).trim();
  if (!raw) {
    return '';
  }
  if (!/^https?:\/\//i.test(raw)) {
    throw new Error(
      `content_source_url must be http/https when provided. Received: ${raw}`
    );
  }
  return raw;
}

async function readJson(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content);
}

function ensureObject(value, fieldName) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${fieldName} must be a JSON object`);
  }
  return value;
}

function guessMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') {
    return 'image/png';
  }
  if (ext === '.gif') {
    return 'image/gif';
  }
  if (ext === '.webp') {
    return 'image/webp';
  }
  if (ext === '.bmp') {
    return 'image/bmp';
  }
  return 'image/jpeg';
}

function baseNameFromUrl(urlText) {
  try {
    const parsed = new URL(urlText);
    const file = path.basename(parsed.pathname);
    return file || 'image.jpg';
  } catch {
    return 'image.jpg';
  }
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Invalid JSON from ${url}: ${text}`);
  }
  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} from ${url}: ${JSON.stringify(json)}`
    );
  }
  return json;
}

function throwIfWechatError(responseJson, apiName) {
  if (
    responseJson &&
    Object.prototype.hasOwnProperty.call(responseJson, 'errcode') &&
    Number(responseJson.errcode) !== 0
  ) {
    throw new Error(
      `${apiName} failed: errcode=${responseJson.errcode}, errmsg=${responseJson.errmsg ?? ''}`
    );
  }
}

async function getAccessToken({ appid, secret, forceRefresh }) {
  try {
    const stable = await fetchJson(WECHAT_API.stableToken, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credential',
        appid,
        secret,
        force_refresh: Boolean(forceRefresh),
      }),
    });
    throwIfWechatError(stable, 'stable_token');
    if (stable.access_token) {
      return stable.access_token;
    }
  } catch {
    // Fall back to legacy token endpoint.
  }

  const legacyUrl =
    `${WECHAT_API.token}?grant_type=client_credential` +
    `&appid=${encodeURIComponent(appid)}` +
    `&secret=${encodeURIComponent(secret)}`;
  const legacy = await fetchJson(legacyUrl);
  throwIfWechatError(legacy, 'token');
  if (!legacy.access_token) {
    throw new Error('No access_token returned by WeChat token endpoint');
  }
  return legacy.access_token;
}

function isWechatHostedImage(urlText) {
  const lowered = toStringValue(urlText).toLowerCase();
  return WECHAT_HOST_HINTS.some((hint) => lowered.includes(hint));
}

async function loadBinarySource(source, baseDir) {
  const value = toStringValue(source).trim();
  if (!value) {
    throw new Error('Empty image source');
  }

  if (/^data:image\/[a-z0-9.+-]+;base64,/i.test(value)) {
    const [, meta, encoded] =
      value.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i) ?? [];
    if (!meta || !encoded) {
      throw new Error('Invalid data URI image');
    }
    const buffer = Buffer.from(encoded, 'base64');
    const ext = meta.split('/')[1] ?? 'jpg';
    return { buffer, filename: `image.${ext}`, mimeType: meta };
  }

  if (/^https?:\/\//i.test(value)) {
    const response = await fetch(value);
    if (!response.ok) {
      throw new Error(
        `Failed to download image: ${value} (${response.status})`
      );
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    const filename = baseNameFromUrl(value);
    const mimeType = response.headers.get('content-type') || guessMimeType(filename);
    return { buffer: bytes, filename, mimeType };
  }

  const resolved = path.isAbsolute(value)
    ? value
    : path.resolve(baseDir, value);
  const buffer = await fs.readFile(resolved);
  const filename = path.basename(resolved);
  return { buffer, filename, mimeType: guessMimeType(filename) };
}

async function uploadImageForArticle(accessToken, imageFile) {
  const form = new FormData();
  form.append(
    'media',
    new Blob([imageFile.buffer], { type: imageFile.mimeType }),
    imageFile.filename
  );
  const url =
    `${WECHAT_API.uploadImageInArticle}?access_token=${encodeURIComponent(
      accessToken
    )}`;
  const response = await fetchJson(url, { method: 'POST', body: form });
  throwIfWechatError(response, 'media/uploadimg');
  if (!response.url) {
    throw new Error(`media/uploadimg did not return url: ${JSON.stringify(response)}`);
  }
  return response.url;
}

async function uploadCoverMaterial(accessToken, imageFile) {
  const form = new FormData();
  form.append(
    'media',
    new Blob([imageFile.buffer], { type: imageFile.mimeType }),
    imageFile.filename
  );
  const url =
    `${WECHAT_API.uploadMaterial}?type=image&access_token=${encodeURIComponent(
      accessToken
    )}`;
  const response = await fetchJson(url, { method: 'POST', body: form });
  throwIfWechatError(response, 'material/add_material');
  if (!response.media_id) {
    throw new Error(
      `material/add_material did not return media_id: ${JSON.stringify(response)}`
    );
  }
  return response.media_id;
}

async function uploadInlineImages(html, { accessToken, baseDir }) {
  const uniqueSources = [...new Set(extractImageSources(html))];
  const replacements = new Map();

  for (const src of uniqueSources) {
    if (isWechatHostedImage(src)) {
      continue;
    }
    const file = await loadBinarySource(src, baseDir);
    const uploadedUrl = await uploadImageForArticle(accessToken, file);
    replacements.set(src, uploadedUrl);
  }

  return {
    html: replacements.size ? replaceImageSources(html, replacements) : html,
    replacements,
  };
}

function buildArticlePayload(meta, html, thumbMediaId) {
  const title = toStringValue(meta.title).trim();
  ensureRequired(title, 'title');
  ensureRequired(thumbMediaId, 'thumb_media_id (or cover_image)');

  const article = {
    title,
    author: toStringValue(meta.author).trim(),
    digest: toStringValue(meta.digest).trim(),
    content: html,
    content_source_url: normalizeContentSourceUrl(meta.content_source_url),
    thumb_media_id: thumbMediaId,
  };

  const needOpenComment = readIntFlag(meta.need_open_comment);
  if (needOpenComment !== undefined) {
    article.need_open_comment = needOpenComment;
  }
  const onlyFansCanComment = readIntFlag(meta.only_fans_can_comment);
  if (onlyFansCanComment !== undefined) {
    article.only_fans_can_comment = onlyFansCanComment;
  }
  if (meta.pic_crop_235_1) {
    article.pic_crop_235_1 = toStringValue(meta.pic_crop_235_1);
  }
  if (meta.pic_crop_1_1) {
    article.pic_crop_1_1 = toStringValue(meta.pic_crop_1_1);
  }

  return article;
}

async function saveHtmlIfRequested(html, outputPath) {
  if (!outputPath) {
    return;
  }
  const resolved = path.resolve(outputPath);
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, html, 'utf8');
}

function printStylePresets() {
  const lines = listStylePresets().map(
    (item) => `- ${item.name}: ${item.description}`
  );
  console.log(lines.join('\n'));
}

function printUsage() {
  console.log(`Usage:
  node scripts/publish_wechat_draft.mjs --markdown <article.md> --meta <article.meta.json> [options]

Required:
  --markdown        Markdown article path
  --meta            Metadata JSON path

Auth (required unless --dry-run):
  --appid           WeChat appid (or env WECHAT_APPID)
  --secret          WeChat secret (or env WECHAT_SECRET)
  --access-token    Optional existing access token

Options:
  --output-html     Save converted HTML to file
  --style           Preset style (formal, business, simple, modern)
  --style-file      JSON style override file
  --list-styles     Print available style presets and exit
  --thumb-media-id  Override thumb_media_id from metadata
  --cover-image     Override cover_image from metadata
  --base-dir        Resolve relative image paths from this directory
  --force-refresh   Force stable token refresh
  --dry-run         Build payload locally without WeChat API calls
  --help            Show this message`);
}

async function runCli() {
  const args = parseArgs(process.argv.slice(2));
  if (args['list-styles']) {
    printStylePresets();
    return;
  }
  if (args.help || args.h || !args.markdown || !args.meta) {
    printUsage();
    process.exit(args.markdown && args.meta ? 0 : 1);
  }

  const markdownPath = path.resolve(String(args.markdown));
  const markdownRaw = await fs.readFile(markdownPath, 'utf8');
  const { frontmatter } = splitFrontmatter(markdownRaw);

  const metaPath = path.resolve(String(args.meta));
  const metaFromJson = await readJson(metaPath);
  const meta = {
    ...frontmatter,
    ...metaFromJson,
  };

  if (args['thumb-media-id']) {
    meta.thumb_media_id = args['thumb-media-id'];
  }
  if (args['cover-image']) {
    meta.cover_image = args['cover-image'];
  }

  const baseDir = args['base-dir']
    ? path.resolve(String(args['base-dir']))
    : path.dirname(markdownPath);

  const styleOverride = args['style-file']
    ? ensureObject(
        await readJson(path.resolve(String(args['style-file']))),
        'style-file'
      )
    : undefined;

  let html = await renderMarkdownToWechatHtml(markdownRaw, {
    stylePreset: args.style,
    styleOverride,
  });
  await saveHtmlIfRequested(html, args['output-html']);

  if (args['dry-run']) {
    const article = buildArticlePayload(
      meta,
      html,
      toStringValue(meta.thumb_media_id || '__MISSING_THUMB_MEDIA_ID__')
    );
    const payload = { articles: [article] };
    process.stdout.write(
      `${JSON.stringify(
        {
          mode: 'dry-run',
          note:
            'No WeChat API calls were made. If thumb_media_id is missing, provide thumb_media_id or cover_image for real publish.',
          payload,
        },
        null,
        2
      )}\n`
    );
    return;
  }

  const appid = toStringValue(args.appid || process.env.WECHAT_APPID).trim();
  const secret = toStringValue(args.secret || process.env.WECHAT_SECRET).trim();
  const forceRefresh = Boolean(args['force-refresh']);

  const accessToken =
    toStringValue(args['access-token']).trim() ||
    (await getAccessToken({ appid, secret, forceRefresh }));

  if (!accessToken) {
    throw new Error('Unable to acquire WeChat access_token');
  }

  const uploadResult = await uploadInlineImages(html, {
    accessToken,
    baseDir,
  });
  html = uploadResult.html;
  await saveHtmlIfRequested(html, args['output-html']);

  let thumbMediaId = toStringValue(meta.thumb_media_id).trim();
  if (!thumbMediaId && meta.cover_image) {
    const cover = await loadBinarySource(meta.cover_image, baseDir);
    thumbMediaId = await uploadCoverMaterial(accessToken, cover);
  }

  const article = buildArticlePayload(meta, html, thumbMediaId);

  if (article.content.length > 20000) {
    console.warn(
      `Warning: article content length (${article.content.length}) is above 20k characters. WeChat may reject it.`
    );
  }

  const payload = { articles: [article] };
  const draftUrl =
    `${WECHAT_API.addDraft}?access_token=${encodeURIComponent(accessToken)}`;
  const response = await fetchJson(draftUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  throwIfWechatError(response, 'draft/add');

  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        media_id: response.media_id,
        uploaded_inline_images: uploadResult.replacements.size,
      },
      null,
      2
    )}\n`
  );
}

if (pathToFileURL(process.argv[1] ?? '').href === import.meta.url) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
