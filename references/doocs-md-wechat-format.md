# doocs/md Format Notes

## What was verified

The `doocs/md` project renders Markdown into HTML with semantic tags and class-based styling, then scopes styles under a root container. Relevant sources:

- Renderer implementation:
  - [renderer-impl.ts](https://raw.githubusercontent.com/doocs/md/main/packages/core/src/renderer/renderer-impl.ts)
- Theme scope utility:
  - [scope.ts](https://raw.githubusercontent.com/doocs/md/main/packages/core/src/theme/scope.ts)
- Default theme CSS:
  - [default.css](https://raw.githubusercontent.com/doocs/md/main/packages/shared/src/theme-css/default.css)

## Key renderer behavior

- Headings render as `h1`...`h6` and include stable `id`.
- Paragraphs render as `p`.
- Links render as `a`; special handling exists for some WeChat article links.
- Images render as image blocks (with figure/caption handling in renderer path).
- Code blocks render as `pre > code`.
- Tables render with `table/thead/tbody/tr/th/td`.

## Styling behavior

- doocs default styling is class-driven (`.h1`, `.paragraph`, `.blockquote`, etc.).
- The style system scopes selectors under the root class (for example, `.md`) through theme scoping logic.
- In WeChat draft `content`, inline styles are typically more reliable than external class selectors.

## Practical implication for this skill

`scripts/markdown_to_wechat_html.mjs` keeps doocs-like structure but rewrites output into WeChat-friendly HTML with sanitized tags/attributes and inline styles adapted from doocs default theme values.
