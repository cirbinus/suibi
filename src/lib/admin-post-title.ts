import { renderContent } from '@/lib/markdown';

const SENTENCE_END_RE = /^.*?[。！？!?]/u;
const TRAILING_EXCERPT_ELLIPSIS_RE = /\.\.\.$/;
const SPACE_BEFORE_PUNCTUATION_RE = /\s+([。！？!?，,；;：:])/gu;

function decodeCommonEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/gi, "'");
}

/**
 * Label used by admin content lists and selectors.
 *
 * Untitled fragments use their first sentence. The visible fallback keeps at
 * most 15 Unicode characters, followed by a single ellipsis when truncated.
 */
export function adminContentDisplayTitle(
  title: string | null | undefined,
  text: string | null | undefined,
): string {
  if (title) return title;
  if (!text) return '无标题';

  const rendered = renderContent(text, 64).plainExcerpt;
  const plain = decodeCommonEntities(rendered)
    .replace(TRAILING_EXCERPT_ELLIPSIS_RE, '')
    .replace(SPACE_BEFORE_PUNCTUATION_RE, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain) return '无标题';

  const firstSentence = plain.match(SENTENCE_END_RE)?.[0] || plain;
  const characters = Array.from(firstSentence);
  return characters.length > 15
    ? `${characters.slice(0, 15).join('')}…`
    : firstSentence;
}

export const adminPostDisplayTitle = adminContentDisplayTitle;
