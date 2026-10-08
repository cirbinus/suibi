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
    const shell = read('components/SuibiShell.astro');
    const post = read('components/Post.astro');

    expect(index).not.toContain('typecho-plugin-notes');
    expect(index).not.toContain('getNotesStreamForTheme');
    expect(index).not.toContain("type: 'note'");
    expect(index).toContain('posts.map');
    expect(index).toContain('data-suibi-stream');
    expect(index).toContain('随笔');
    expect(shell).not.toContain('stream=notes');
    expect(shell).not.toContain('>文章<');
    expect(shell).not.toContain('>笔记<');
    expect(shell).toContain('归档');
    expect(post).not.toContain('typecho-plugin-notes');
    expect(post).toContain('itemprop="headline"');
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
    expect(comments).toContain("const onPageShow = event => {");
    expect(comments).toContain("window.removeEventListener('pageshow', onPageShow);");
    expect(pagination).toContain('class="suibi-pagination suibi-pagination--progressive"');
  });

  it('uses a compact, borderless, responsive reading layout', () => {
    const css = read('style.css');
    expect(css).toContain('--suibi-page-width: 780px;');
    expect(css).toContain('--suibi-reading-width: 720px;');
    expect(css).toContain('--suibi-accent: #244564;');
    expect(css).toContain('@media (max-width: 640px)');
    expect(css).not.toContain('box-shadow:');
    expect(css).toContain('prefers-reduced-motion');
    expect(css).toContain('border-bottom: 1px solid var(--suibi-border);');
  });
});
