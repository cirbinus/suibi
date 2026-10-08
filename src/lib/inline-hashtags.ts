export interface InlineHashtagLink {
  name: string;
  permalink: string;
}

const BLOCKED_HTML_TAGS = new Set(['a', 'code', 'pre', 'script', 'style']);
const HASHTAG_BOUNDARY = '[\\s(（\\[【，。！？,.!?；;：:、]';
const HASHTAG_END = '[\\s#，。！？,.!?；;：:、()（）\\[\\]【】{}<>"“”‘’]';
const MAX_HASHTAG_CHARACTERS = 40;

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

/** Extract inline #topics while ignoring Markdown headings and code. */
export function extractInlineHashtagNames(source: string): string[] {
  const names: string[] = [];
  let fenced = false;

  for (const originalLine of source.replace(/^<!--markdown-->/, '').split(/\r?\n/u)) {
    if (/^\s*(```|~~~)/u.test(originalLine)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;

    const line = originalLine
      .replace(/`[^`]*`/gu, ' ')
      .replace(/<[^>]*>/gu, ' ');
    const pattern = new RegExp(`(^|${HASHTAG_BOUNDARY})#([^${HASHTAG_END.slice(1, -1)}]+)`, 'gu');
    for (const match of line.matchAll(pattern)) {
      const name = match[2]?.trim();
      if (!name || Array.from(name).length > MAX_HASHTAG_CHARACTERS) continue;
      names.push(name);
    }
  }

  return unique(names);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Link known hashtags in rendered HTML without touching links or code blocks. */
export function linkifyInlineHashtags(html: string, tags: InlineHashtagLink[]): string {
  const validTags = tags
    .filter(tag => tag.name && tag.permalink)
    .sort((a, b) => Array.from(b.name).length - Array.from(a.name).length);
  if (validTags.length === 0 || !html.includes('#')) return html;

  const byName = new Map(validTags.map(tag => [tag.name, tag]));
  const names = validTags.map(tag => escapeRegExp(tag.name)).join('|');
  const pattern = new RegExp(`(^|${HASHTAG_BOUNDARY})#(${names})(?=$|${HASHTAG_END})`, 'gu');
  const blocked: string[] = [];

  return html.split(/(<[^>]+>)/gu).map(part => {
    if (part.startsWith('<')) {
      const closing = /^<\/\s*([a-z][\w-]*)/iu.exec(part)?.[1]?.toLowerCase();
      const opening = /^<\s*([a-z][\w-]*)/iu.exec(part)?.[1]?.toLowerCase();
      if (closing && BLOCKED_HTML_TAGS.has(closing)) {
        const index = blocked.lastIndexOf(closing);
        if (index >= 0) blocked.splice(index, 1);
      } else if (opening && BLOCKED_HTML_TAGS.has(opening) && !/\/>$/u.test(part)) {
        blocked.push(opening);
      }
      return part;
    }
    if (blocked.length > 0) return part;

    return part.replace(pattern, (_match, prefix: string, name: string) => {
      const tag = byName.get(name);
      if (!tag) return _match;
      return `${prefix}<a class="suibi-topic-highlight" href="${escapeAttribute(tag.permalink)}">#${name}</a>`;
    });
  }).join('');
}
