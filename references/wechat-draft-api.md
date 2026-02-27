# WeChat Draft API Flow

## Official docs

- Draft add:
  - [api_draft_add](https://developers.weixin.qq.com/doc/subscription/api/draftbox/draftmanage/api_draft_add.html)
- Publish flow:
  - [publish guide](https://developers.weixin.qq.com/doc/subscription/guide/product/publish.html)
- Asset flow:
  - [asset guide](https://developers.weixin.qq.com/doc/subscription/guide/product/asset.html)
- Supporting SDK reference (field notes and practical constraints):
  - [WxMpDraftService Javadoc](https://javadoc.io/static/com.github.binarywang/weixin-java-mp/4.2.6.B/me/chanjar/weixin/mp/api/WxMpDraftService.html)

## Request sequence

1. Get access token:
- Preferred: `POST /cgi-bin/stable_token`
- Fallback: `GET /cgi-bin/token`

2. Upload article body images:
- `POST /cgi-bin/media/uploadimg?access_token=...`
- Returns WeChat-hosted image URL for `<img src>`.

3. Upload cover image:
- `POST /cgi-bin/material/add_material?type=image&access_token=...`
- Returns `media_id`, used as `thumb_media_id`.

4. Add draft:
- `POST /cgi-bin/draft/add?access_token=...`
- Payload shape:
  - `{"articles":[{title,author,digest,content,content_source_url,thumb_media_id,...}]}`

## Payload fields used by this skill

- `title` (required)
- `author`
- `digest`
- `content` (required, HTML string)
- `content_source_url`
- `thumb_media_id` (required by this workflow; generated from `cover_image` if missing)
- `need_open_comment` (`0` or `1`)
- `only_fans_can_comment` (`0` or `1`)
- `pic_crop_235_1` and `pic_crop_1_1` (optional)

## Constraints and behavior notes

- Draft content supports rich text HTML but scripts/unsafe tags should not be used.
- A common practical limit is around 20k characters for `content`; keep drafts compact.
- Article images in `content` should be WeChat-hosted URLs from `uploadimg`.
- API responses may return `errcode/errmsg`; treat non-zero `errcode` as failure.

## Metadata JSON example

```json
{
  "title": "Weekly Engineering Notes",
  "author": "OpenClaw Agent",
  "digest": "A short summary for preview cards.",
  "content_source_url": "https://example.com/original-post",
  "cover_image": "./cover.jpg",
  "need_open_comment": 1,
  "only_fans_can_comment": 0
}
```
