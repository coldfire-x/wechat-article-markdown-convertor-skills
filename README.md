# wechat-markdown-draft

Convert Markdown articles into WeChat-compatible rich text HTML and create WeChat draft articles via official WeChat APIs.

## 1. Install the skill

Copy this folder into your Codex skills directory:

```bash
mkdir -p "$CODEX_HOME/skills"
cp -R ./ "$CODEX_HOME/skills/wechat-markdown-draft" # cp current repo to your skills folder
```

If you already keep skills in another managed location, make sure the final folder name is exactly:

`wechat-markdown-draft`

## 2. Prerequisites

- Node.js 20+ recommended (Node 18+ may also work).
- A WeChat public account with API access.
- `appid` and `secret` for the target WeChat account.

Optional:
- Install [`marked`](https://www.npmjs.com/package/marked) for higher-fidelity Markdown rendering.  
  Without it, the built-in fallback parser is used.

```bash
npm install marked
```

## 3. Prepare files

Create:

1. `article.md` (your Markdown content)
2. `article.meta.json` (draft metadata)

Example `article.meta.json`:

```json
{
  "title": "My WeChat Post",
  "author": "OpenClaw",
  "digest": "Short preview text",
  "content_source_url": "https://example.com/original-post",
  "cover_image": "./cover.jpg",
  "need_open_comment": 1,
  "only_fans_can_comment": 0
}
```

Notes:
- Provide either `thumb_media_id` or `cover_image`.
- If `cover_image` is provided, the script uploads it and fills `thumb_media_id`.

## 4. Convert Markdown only

```bash
node scripts/markdown_to_wechat_html.mjs \
  --input ./article.md \
  --style modern \
  --output ./article.wechat.html
```

List built-in styles:

```bash
node scripts/markdown_to_wechat_html.mjs --list-styles
```

## 5. Style presets and custom style file

Built-in presets:
- `formal`
- `business` (default)
- `simple`
- `modern` (`github` alias)

Use a custom style JSON to override any preset:

`style.override.json`

```json
{
  "preset": "modern",
  "tagStyles": {
    "h2": "font-size:1.3em;font-weight:700;color:#0f766e;margin:1.2em 6px 0.6em;",
    "blockquote": "display:block;margin:1em 6px;padding:0.8em 1em;border-left:4px solid #0f766e;background:#f0fdfa;color:#134e4a;"
  }
}
```

You can start from the bundled example:
`references/style-override.example.json`

Apply it in conversion:

```bash
node scripts/markdown_to_wechat_html.mjs \
  --input ./article.md \
  --style-file ./style.override.json \
  --output ./article.wechat.html
```

## 6. Dry run (recommended first)

Dry run builds the final payload but does not call WeChat APIs:

```bash
node scripts/publish_wechat_draft.mjs \
  --markdown ./article.md \
  --meta ./article.meta.json \
  --style business \
  --dry-run \
  --output-html ./article.wechat.html
```

## 7. Publish draft to WeChat

Set credentials:

```bash
export WECHAT_APPID="your_appid"
export WECHAT_SECRET="your_secret"
```

Create the draft:

```bash
node scripts/publish_wechat_draft.mjs \
  --markdown ./article.md \
  --meta ./article.meta.json \
  --style-file ./style.override.json \
  --appid "$WECHAT_APPID" \
  --secret "$WECHAT_SECRET" \
  --output-html ./article.wechat.html
```

On success, output includes:
- `media_id` (the created draft ID)
- `uploaded_inline_images` (count of uploaded body images)

## 8. Common issues

- `Missing required field: title`: add `title` in meta JSON or markdown frontmatter.
- `thumb_media_id` missing: provide `thumb_media_id` or `cover_image`.
- WeChat `errcode != 0`: token/permissions/content format issue; use `--dry-run` first and verify credentials and account scopes.

## 9. References

- Skill workflow: [SKILL.md](./SKILL.md)
- WeChat API notes: [references/wechat-draft-api.md](./references/wechat-draft-api.md)
- doocs renderer notes: [references/doocs-md-wechat-format.md](./references/doocs-md-wechat-format.md)
