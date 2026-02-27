---
name: wechat-markdown-draft
description: Convert Markdown articles into WeChat-compatible rich text HTML and create WeChat article drafts through official APIs. Use when Codex needs to publish or stage WeChat public account content from `.md` files, including converting styling for WeChat editor compatibility, uploading inline images, uploading cover images, and calling `draft/add` to create a draft.
---

# WeChat Markdown Draft

Convert Markdown into WeChat-friendly HTML with inline styles and publish it as a draft via WeChat APIs.

## Workflow

1. Read and normalize inputs.
- Require a Markdown file and a metadata JSON file.
- Parse optional YAML frontmatter in Markdown for fallback metadata values.

2. Convert Markdown to WeChat-safe HTML.
- Run [`scripts/markdown_to_wechat_html.mjs`](scripts/markdown_to_wechat_html.mjs).
- Prefer `marked` if installed; otherwise use built-in fallback parser.
- Sanitize unsupported tags/attributes and map styles inline for WeChat rendering.

3. Upload images for WeChat.
- Upload body images with `media/uploadimg` to get CDN URLs.
- Upload cover image with `material/add_material?type=image` to get `thumb_media_id`.
- Keep existing WeChat-hosted image URLs unchanged.

4. Create draft.
- Build `articles: [{...}]` payload and call `draft/add`.
- Save resulting `media_id` from response.

## Commands

Convert Markdown only:

```bash
node scripts/markdown_to_wechat_html.mjs \
  --input ./article.md \
  --style modern \
  --output ./article.wechat.html
```

List available style presets:

```bash
node scripts/markdown_to_wechat_html.mjs --list-styles
```

Create draft (full flow):

```bash
node scripts/publish_wechat_draft.mjs \
  --markdown ./article.md \
  --meta ./article.meta.json \
  --style business \
  --appid "$WECHAT_APPID" \
  --secret "$WECHAT_SECRET"
```

Dry run without WeChat API calls:

```bash
node scripts/publish_wechat_draft.mjs \
  --markdown ./article.md \
  --meta ./article.meta.json \
  --style-file ./style.override.json \
  --dry-run \
  --output-html ./article.wechat.html
```

## Style Mechanism

Predefined presets:

- `formal`
- `business` (default)
- `simple`
- `modern` (`github` alias)

User custom style:

- Pass `--style-file <json>` to override preset styles.
- Supported JSON keys:
  - `preset` or `extends`: base preset
  - `rootStyle` (or `root`): root `<section>` inline style
  - `tagStyles` (or `tags`): per-tag style map
  - `classStyles` (or `classes`): class-based style map

Example:

```json
{
  "preset": "modern",
  "tagStyles": {
    "h2": "font-size:1.25em;font-weight:700;color:#0f766e;margin:1.2em 6px 0.6em;",
    "blockquote": "display:block;margin:1em 6px;padding:0.7em 1em;border-left:4px solid #0f766e;background:#f0fdfa;color:#134e4a;"
  }
}
```

## Required Metadata

Read metadata from JSON file, with Markdown frontmatter as fallback:

- `title` (required)
- `author`
- `digest`
- `content_source_url`
- `thumb_media_id` (required unless `cover_image` is provided)
- `cover_image` (path/URL; used to create `thumb_media_id`)
- `need_open_comment` (`0` or `1`)
- `only_fans_can_comment` (`0` or `1`)

See [`references/wechat-draft-api.md`](references/wechat-draft-api.md) for payload details.

## Error Handling Rules

- Fail fast when required fields are missing.
- Fail when no `thumb_media_id` and no `cover_image` are provided.
- Fail on non-zero WeChat `errcode`.
- Prefer `--dry-run` first when validating new content.

## References

- [`references/doocs-md-wechat-format.md`](references/doocs-md-wechat-format.md)
- [`references/wechat-draft-api.md`](references/wechat-draft-api.md)
- [`references/style-override.example.json`](references/style-override.example.json)
