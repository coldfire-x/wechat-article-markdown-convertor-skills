const STYLE_PRESETS = {
  business: {
    description: 'WeChat-friendly business style with accent blocks and clear hierarchy.',
    rootStyle:
      'font-size:16px;line-height:1.75;color:#3f3f3f;word-wrap:break-word;font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;',
    tagStyles: {
      h1: 'font-size:1.1em;text-align:center;font-weight:bold;display:table;margin:1.5em auto 0.75em;padding:0 0.8em;border-bottom:2px solid rgba(0,152,116,0.9);line-height:1.2;',
      h2: 'font-size:1.1em;text-align:center;font-weight:bold;display:table;margin:3em auto 1.5em;padding:0 0.2em;background:rgba(0,152,116,0.9);color:#fff;line-height:1.2;',
      h3: 'font-weight:bold;font-size:1em;margin:1.5em 6px 0.5em;line-height:1.2;color:rgba(66,185,131,0.9);',
      h4: 'font-weight:bold;font-size:0.9em;margin:1.5em 6px 0.5em;line-height:1.2;color:rgba(66,185,131,0.9);',
      h5: 'font-weight:bold;font-size:0.9em;margin:1.5em 6px 0.5em;line-height:1.2;color:rgba(66,185,131,0.9);',
      h6: 'font-weight:bold;font-size:0.9em;margin:1.5em 6px 0.5em;line-height:1.2;color:rgba(66,185,131,0.9);',
      p: 'margin:1em 6px;line-height:1.75;font-size:16px;color:#3f3f3f;',
      blockquote:
        'display:block;margin:1em 6px;padding:0.8em 1em;border-left:4px solid rgba(0,152,116,0.9);background:#f8f8f8;color:#666;',
      ul: 'margin:0.8em 6px;padding-left:1.5em;color:#3f3f3f;',
      ol: 'margin:0.8em 6px;padding-left:1.5em;color:#3f3f3f;',
      li: 'margin:0.3em 0;line-height:1.75;',
      a: 'color:#576b95;text-decoration:none;',
      img: 'display:block;max-width:100%;height:auto;margin:0.8em auto;',
      strong: 'font-weight:bold;color:#000;',
      em: 'font-style:italic;',
      code:
        'font-family:Menlo,Consolas,monospace;font-size:0.9em;background:rgba(27,31,35,0.05);padding:2px 4px;border-radius:3px;',
      pre: 'overflow-x:auto;padding:0.8em;margin:1em 6px;border-radius:6px;background:#f7f7f7;line-height:1.6;',
      table:
        'border-collapse:collapse;text-align:center;margin:0.8em 6px;color:#3f3f3f;width:calc(100% - 12px);',
      th: 'border:1px solid #dfdfdf;padding:0.4em;background:#f0f0f0;',
      td: 'border:1px solid #dfdfdf;padding:0.4em;',
      hr: 'border:none;border-top:1px solid #e7e7e7;margin:2em 6px;',
      figure: 'margin:1em 6px;text-align:center;',
      figcaption: 'font-size:14px;color:#888;margin-top:0.4em;',
    },
  },
  formal: {
    description: 'Traditional editorial style with restrained accents and serif-friendly typography.',
    rootStyle:
      'font-size:16px;line-height:1.85;color:#2f2f2f;word-wrap:break-word;font-family:Georgia,"Times New Roman","PingFang SC","Hiragino Sans GB","Microsoft YaHei",serif;',
    tagStyles: {
      h1: 'font-size:1.3em;text-align:center;font-weight:700;display:block;margin:1.8em 0 0.8em;padding-bottom:0.4em;border-bottom:1px solid #d8d8d8;color:#1f1f1f;line-height:1.3;',
      h2: 'font-size:1.2em;text-align:left;font-weight:700;display:block;margin:1.8em 6px 0.9em;padding-left:0.6em;border-left:3px solid #555;color:#1f1f1f;line-height:1.3;',
      h3: 'font-size:1.05em;font-weight:700;margin:1.4em 6px 0.6em;color:#2c2c2c;',
      h4: 'font-size:0.98em;font-weight:700;margin:1.2em 6px 0.5em;color:#3a3a3a;',
      h5: 'font-size:0.95em;font-weight:700;margin:1.1em 6px 0.45em;color:#444;',
      h6: 'font-size:0.92em;font-weight:700;margin:1em 6px 0.4em;color:#555;',
      p: 'margin:1em 6px;line-height:1.85;font-size:16px;color:#2f2f2f;text-align:justify;',
      blockquote:
        'display:block;margin:1em 6px;padding:0.7em 1em;border-left:3px solid #8f8f8f;background:#f8f8f8;color:#555;',
      ul: 'margin:0.9em 6px;padding-left:1.5em;color:#2f2f2f;',
      ol: 'margin:0.9em 6px;padding-left:1.5em;color:#2f2f2f;',
      li: 'margin:0.35em 0;line-height:1.8;',
      a: 'color:#1f4b99;text-decoration:underline;',
      img: 'display:block;max-width:100%;height:auto;margin:1em auto;',
      strong: 'font-weight:700;color:#111;',
      em: 'font-style:italic;color:#333;',
      code:
        'font-family:"SFMono-Regular",Consolas,monospace;font-size:0.9em;background:#f1f1f1;padding:2px 4px;border-radius:2px;',
      pre: 'overflow-x:auto;padding:0.9em;margin:1em 6px;border-radius:3px;background:#f5f5f5;line-height:1.65;',
      table:
        'border-collapse:collapse;text-align:left;margin:1em 6px;color:#2f2f2f;width:calc(100% - 12px);',
      th: 'border:1px solid #dadada;padding:0.45em;background:#f4f4f4;font-weight:700;',
      td: 'border:1px solid #dadada;padding:0.45em;',
      hr: 'border:none;border-top:1px solid #d8d8d8;margin:2em 6px;',
      figure: 'margin:1em 6px;text-align:center;',
      figcaption: 'font-size:14px;color:#777;margin-top:0.4em;font-style:italic;',
    },
  },
  simple: {
    description: 'Minimal clean style with low visual weight and neutral typography.',
    rootStyle:
      'font-size:16px;line-height:1.7;color:#333;word-wrap:break-word;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;',
    tagStyles: {
      h1: 'font-size:1.25em;font-weight:700;margin:1.4em 6px 0.7em;color:#222;line-height:1.3;',
      h2: 'font-size:1.15em;font-weight:700;margin:1.4em 6px 0.7em;color:#222;line-height:1.3;',
      h3: 'font-size:1.05em;font-weight:600;margin:1.2em 6px 0.6em;color:#2a2a2a;',
      h4: 'font-size:1em;font-weight:600;margin:1.1em 6px 0.5em;color:#2f2f2f;',
      h5: 'font-size:0.96em;font-weight:600;margin:1em 6px 0.45em;color:#333;',
      h6: 'font-size:0.92em;font-weight:600;margin:1em 6px 0.4em;color:#444;',
      p: 'margin:0.9em 6px;line-height:1.7;font-size:16px;color:#333;',
      blockquote:
        'display:block;margin:0.9em 6px;padding:0.6em 0.9em;border-left:3px solid #d5d5d5;background:#fafafa;color:#555;',
      ul: 'margin:0.7em 6px;padding-left:1.45em;color:#333;',
      ol: 'margin:0.7em 6px;padding-left:1.45em;color:#333;',
      li: 'margin:0.28em 0;line-height:1.7;',
      a: 'color:#2878d8;text-decoration:none;',
      img: 'display:block;max-width:100%;height:auto;margin:0.8em auto;',
      strong: 'font-weight:700;color:#111;',
      em: 'font-style:italic;',
      code:
        'font-family:ui-monospace,Menlo,Consolas,monospace;font-size:0.9em;background:#f2f2f2;padding:2px 4px;border-radius:3px;',
      pre: 'overflow-x:auto;padding:0.75em;margin:0.9em 6px;border-radius:4px;background:#f6f6f6;line-height:1.6;',
      table:
        'border-collapse:collapse;text-align:left;margin:0.9em 6px;color:#333;width:calc(100% - 12px);',
      th: 'border:1px solid #e1e1e1;padding:0.4em;background:#f8f8f8;',
      td: 'border:1px solid #e1e1e1;padding:0.4em;',
      hr: 'border:none;border-top:1px solid #ececec;margin:1.8em 6px;',
      figure: 'margin:0.9em 6px;text-align:center;',
      figcaption: 'font-size:13px;color:#888;margin-top:0.35em;',
    },
  },
  modern: {
    description: 'GitHub-like modern documentation style with crisp spacing and code emphasis.',
    rootStyle:
      'font-size:16px;line-height:1.75;color:#24292f;word-wrap:break-word;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans","PingFang SC","Microsoft YaHei",sans-serif;',
    tagStyles: {
      h1: 'font-size:1.6em;font-weight:700;margin:1.3em 6px 0.6em;padding-bottom:0.25em;border-bottom:1px solid #d0d7de;color:#1f2328;line-height:1.25;',
      h2: 'font-size:1.35em;font-weight:700;margin:1.2em 6px 0.55em;padding-bottom:0.25em;border-bottom:1px solid #d0d7de;color:#1f2328;line-height:1.3;',
      h3: 'font-size:1.15em;font-weight:600;margin:1.1em 6px 0.45em;color:#1f2328;line-height:1.35;',
      h4: 'font-size:1.05em;font-weight:600;margin:1em 6px 0.4em;color:#1f2328;line-height:1.35;',
      h5: 'font-size:0.98em;font-weight:600;margin:1em 6px 0.35em;color:#1f2328;line-height:1.35;',
      h6: 'font-size:0.9em;font-weight:600;margin:1em 6px 0.35em;color:#57606a;line-height:1.35;',
      p: 'margin:0.9em 6px;line-height:1.75;font-size:16px;color:#24292f;',
      blockquote:
        'display:block;margin:1em 6px;padding:0.2em 1em;border-left:0.25em solid #d0d7de;color:#57606a;background:#fff;',
      ul: 'margin:0.8em 6px;padding-left:1.5em;color:#24292f;',
      ol: 'margin:0.8em 6px;padding-left:1.5em;color:#24292f;',
      li: 'margin:0.25em 0;line-height:1.7;',
      a: 'color:#0969da;text-decoration:none;',
      img: 'display:block;max-width:100%;height:auto;margin:0.9em auto;border-radius:4px;',
      strong: 'font-weight:600;color:#1f2328;',
      em: 'font-style:italic;',
      code:
        'font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:0.88em;background:rgba(175,184,193,0.2);padding:0.2em 0.4em;border-radius:6px;',
      pre: 'overflow-x:auto;padding:1em;margin:0.9em 6px;border-radius:6px;background:#f6f8fa;line-height:1.55;',
      table:
        'border-collapse:collapse;text-align:left;margin:0.9em 6px;color:#24292f;width:calc(100% - 12px);',
      th: 'border:1px solid #d0d7de;padding:0.4em;background:#f6f8fa;font-weight:600;',
      td: 'border:1px solid #d0d7de;padding:0.4em;',
      hr: 'border:none;border-top:1px solid #d8dee4;margin:1.8em 6px;',
      figure: 'margin:0.9em 6px;text-align:center;',
      figcaption: 'font-size:12px;color:#57606a;margin-top:0.3em;',
    },
  },
};

const PRESET_ALIAS = {
  default: 'business',
  github: 'modern',
};

function buildClassStylesFromTagStyles(tagStyles) {
  return {
    h1: tagStyles.h1,
    h2: tagStyles.h2,
    h3: tagStyles.h3,
    h4: tagStyles.h4,
    h5: tagStyles.h5,
    h6: tagStyles.h6,
    paragraph: tagStyles.p,
    blockquote: tagStyles.blockquote,
    ul: tagStyles.ul,
    ol: tagStyles.ol,
    listitem: tagStyles.li,
    link: tagStyles.a,
    image: tagStyles.img,
    code: tagStyles.code,
    'code-block': tagStyles.pre,
    table: tagStyles.table,
    thead: tagStyles.th,
    td: tagStyles.td,
    figure: tagStyles.figure,
    figcaption: tagStyles.figcaption,
  };
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizePresetName(name) {
  const raw = String(name || 'business').trim().toLowerCase();
  return PRESET_ALIAS[raw] || raw;
}

function normalizeStyleObject(input) {
  if (!isObject(input)) {
    return {};
  }
  const rootStyle =
    typeof input.rootStyle === 'string'
      ? input.rootStyle
      : typeof input.root === 'string'
      ? input.root
      : undefined;
  const tagStyles = isObject(input.tagStyles)
    ? input.tagStyles
    : isObject(input.tags)
    ? input.tags
    : undefined;
  const classStyles = isObject(input.classStyles)
    ? input.classStyles
    : isObject(input.classes)
    ? input.classes
    : undefined;
  const preset =
    typeof input.preset === 'string'
      ? input.preset
      : typeof input.extends === 'string'
      ? input.extends
      : undefined;
  return {
    preset,
    rootStyle,
    tagStyles,
    classStyles,
  };
}

export function listStylePresets() {
  return Object.entries(STYLE_PRESETS).map(([name, preset]) => ({
    name,
    description: preset.description,
  }));
}

export function resolveStyleConfig({ presetName, override } = {}) {
  const normalizedOverride = normalizeStyleObject(override);
  const finalPresetName = normalizePresetName(
    normalizedOverride.preset || presetName || 'business'
  );
  const preset = STYLE_PRESETS[finalPresetName];
  if (!preset) {
    const names = listStylePresets()
      .map((item) => item.name)
      .join(', ');
    throw new Error(
      `Unknown style preset: ${finalPresetName}. Available styles: ${names}`
    );
  }

  const tagStyles = {
    ...preset.tagStyles,
    ...(normalizedOverride.tagStyles || {}),
  };
  const classStyles = {
    ...buildClassStylesFromTagStyles(tagStyles),
    ...(normalizedOverride.classStyles || {}),
  };

  return {
    name: finalPresetName,
    description: preset.description,
    rootStyle: normalizedOverride.rootStyle || preset.rootStyle,
    tagStyles,
    classStyles,
  };
}
