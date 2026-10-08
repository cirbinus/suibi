import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(process.cwd(), 'src/themes/typecho-theme-suibi');
const read = (path: string) => readFileSync(join(root, path), 'utf8');

describe('typecho-theme-suibi', () => {
  it('defines one unified essay stream as the default theme', () => {
    const manifest = JSON.parse(read('theme.json'));
    const pkg = JSON.parse(read('package.json'));
    const install = readFileSync(join(process.cwd(), 'src/pages/api/install.ts'), 'utf8');

    expect(pkg.keywords).toEqual(expect.arrayContaining(['typecho', 'theme']));
    expect(manifest).toMatchObject({
      id: 'typecho-theme-suibi',
      name: '随笔',
      publicHtml: true,
      commentsMode: 'api',
    });
    expect(manifest.config.continuousLoadMode.default).toBe('infinite');
    expect(install).toContain("theme: 'typecho-theme-suibi'");
  });

  it('keeps every entry as a post and never exposes a separate notes stream', () => {
    const index = read('components/Index.astro');
    const post = read('components/Post.astro');

    expect(index).not.toContain('typecho-plugin-notes');
    expect(index).not.toContain('getNotesStreamForTheme');
    expect(index).not.toContain("type: 'note'");
    expect(index).toContain('data-suibi-stream');
    expect(post).not.toContain('typecho-plugin-notes');
    expect(post).toContain('itemprop="headline"');
  });

  it('offers only 首页 / 笔记 / 随笔 / 关于 in the header', () => {
    const shell = read('components/SuibiShell.astro');
    const manifest = JSON.parse(read('theme.json'));

    expect(shell).toContain('首页');
    expect(shell).toContain('笔记');
    expect(shell).toContain('随笔');
    expect(shell).not.toContain('归档');
    expect(shell).not.toContain('suibi-nav__dropdown');
    expect(shell).toContain('noteUrl');
    expect(shell).toContain('essayUrl');

    expect(manifest.config.noteCategory.default).toBe('biji');
    expect(manifest.config.essayCategory.default).toBe('suibi');
  });

  it('shows the entry category as the type badge and drops essay titles', () => {
    const dispatcher = read('components/SuibiStreamItem.astro');
    const essay = read('components/SuibiEssayItem.astro');
    const note = read('components/SuibiNoteItem.astro');
    const index = read('components/Index.astro');
    const archive = read('components/Archive.astro');

    expect(index).toContain('SuibiStreamItem');
    expect(archive).toContain('SuibiStreamItem');
    expect(dispatcher).toContain('suibiPostKind');
    expect(dispatcher).toContain('SuibiEssayItem');
    expect(dispatcher).toContain('SuibiNoteItem');

    // The category name is the badge on both kinds.
    expect(dispatcher).toContain('suibi-item-badge');
    expect(dispatcher).toContain('suibi-stream-item--${kind}');
    expect(dispatcher).toContain('isEssay');

    // Essays render the body inline and never repeat a heading.
    expect(essay).toContain('set:html={post.excerpt}');
    expect(essay).not.toContain('<h2');

    // Notes keep a titled heading plus a plain excerpt.
    expect(note).toContain('suibi-item-title');
    expect(note).toContain('<h2');
    expect(note).toContain('plainExcerpt');
  });

  it('maps categories to kinds in one place', () => {
    const shared = read('components/suibi.ts');
    expect(shared).toContain('export function suibiPostKind');
    expect(shared).toContain("'essay'");
    expect(shared).toContain('essayCategory');
    expect(shared).toContain('noteCategory');
  });

  it('provides dynamic loading, fresh-content polling and instant navigation', () => {
    const pagination = read('components/SuibiStreamPagination.astro');
    const shell = read('components/SuibiShell.astro');

    expect(pagination).toContain('fetch(nextUrl');
    expect(pagination).toContain('DOMParser');
    expect(pagination).toContain('IntersectionObserver');
    expect(pagination).toContain('data-suibi-load-more');
    expect(shell).toContain('instantClickSource');
    expect(shell).toContain("InstantClick.init('mousedown')");
    expect(shell).toContain('data-suibi-live-refresh');
    expect(shell).toContain("'Cache-Control': 'no-cache'");
    expect(shell).toContain('有新随笔');
    expect(shell).toContain("CSS.supports('selector(a:has(> img))')");
    expect(shell).toContain("'[view-image] img'");

    const comments = read('components/SuibiComments.astro');
    expect(comments).toContain('const onPageShow = event => {');
    expect(comments).toContain("window.removeEventListener('pageshow', onPageShow);");
    expect(pagination).toContain('class="suibi-pagination suibi-pagination--progressive"');
  });

  it('makes the whole card clickable like a region hit, not just the title', () => {
    const dispatcher = read('components/SuibiStreamItem.astro');
    const warm = readFileSync(join(process.cwd(), 'src/themes/typecho-theme-warm/components/Index.astro'), 'utf8');
    const css = read('style.css');

    // One transparent hit layer per card, rendered first so it sits underneath.
    expect(dispatcher).toContain('class="suibi-stream-item__hit"');
    expect(dispatcher).toContain('href={post.permalink}');
    expect(dispatcher).toContain('aria-label={hitLabel}');
    expect(dispatcher.indexOf('suibi-stream-item__hit')).toBeLessThan(dispatcher.indexOf('suibi-item-meta'));
    // Same mechanism as the reference warm theme (biji.io).
    expect(warm).toContain('warm-stream-item__hit');

    // Hit layer covers the card; real links inside stay above it.
    expect(css).toContain('.suibi-stream-item__hit {');
    expect(css).toContain('inset: 0;');
    expect(css).toContain('a:not(.suibi-stream-item__hit)');
    // Hover paints the clickable region, and the band spans the whole container
    // (same -gutter/+gutter trick as the reference warm theme) so it reads as
    // one full-width row rather than a partial stripe.
    expect(css).toContain('.suibi-stream-item:hover {');
    expect(css).toContain('background: var(--suibi-hover);');
    expect(css).toMatch(/\.suibi-stream-item \{[^}]*margin-inline: calc\(-1 \* var\(--suibi-gutter\)\);[^}]*padding: var\(--suibi-gutter\);/);
    // No separator rules between entries: whitespace + hover carry the rhythm.
    expect(css).not.toContain('.suibi-stream-item + .suibi-stream-item');
  });

  it('uses a compact, borderless, responsive reading layout', () => {
    const css = read('style.css');
    expect(css).toContain('--suibi-page-width: 780px;');
    expect(css).toContain('--suibi-reading-width: 720px;');
    // Warm neutral palette, aligned with the reference warm theme: no cool blue cast.
    expect(css).toContain('--suibi-accent: #685f57;');
    expect(css).toContain('--suibi-text: #242321;');
    expect(css).toContain('--suibi-border: #ebe8e3;');
    expect(css).not.toContain('#244564');
    expect(css).not.toContain('#e5e8e8');
    expect(css).not.toContain('#242c33');
    expect(css).toContain('@media (max-width: 640px)');
    expect(css).not.toContain('box-shadow:');
    expect(css).toContain('prefers-reduced-motion');
    expect(css).toContain('border-bottom: 1px solid var(--suibi-border);');
    expect(css).toContain('.suibi-item-badge');
    expect(css).toContain('.suibi-stream-item--essay');
  });
});
