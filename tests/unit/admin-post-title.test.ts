import { adminContentDisplayTitle, adminPostDisplayTitle } from '@/lib/admin-post-title';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('adminPostDisplayTitle', () => {
  it('keeps an explicit post title unchanged', () => {
    expect(adminPostDisplayTitle('正式标题', '正文第一句。')).toBe('正式标题');
  });

  it('uses the first sentence for an untitled post', () => {
    expect(adminPostDisplayTitle('', '<!--markdown-->今天下班后去河边走了走。后来开始下雨。'))
      .toBe('今天下班后去河边走了走。');
  });

  it('limits the fallback to 15 characters and appends an ellipsis', () => {
    expect(adminPostDisplayTitle(null, '<!--markdown-->这是一段明显超过十五个字符而且暂时没有句号的随笔正文'))
      .toBe('这是一段明显超过十五个字符而且…');
  });

  it('strips markdown and html before deriving the fallback', () => {
    expect(adminPostDisplayTitle('', '<!--markdown-->**今天** <strong>很好</strong>！下一句。'))
      .toBe('今天 很好！');
  });

  it('uses 无标题 only when both title and body are empty', () => {
    expect(adminPostDisplayTitle('', '')).toBe('无标题');
  });

  it('exposes the same fallback for any admin content label', () => {
    expect(adminContentDisplayTitle('', '<!--markdown-->页面正文第一句。后续内容。'))
      .toBe('页面正文第一句。');
  });

  it('wires body text into the manage-posts table fallback', () => {
    const source = readFileSync(join(process.cwd(), 'src/pages/admin/manage-posts.astro'), 'utf8');
    expect(source).toContain('text: schema.contents.text');
    expect(source).toContain('adminPostDisplayTitle(post.title, post.text)');
  });

  it('wires body-derived titles into every admin content surface that used 无标题 directly', () => {
    const adminFiles = [
      'src/pages/admin/index.astro',
      'src/pages/admin/manage-pages.astro',
      'src/pages/admin/options-reading.astro',
      'src/pages/admin/write-page.astro',
      'src/pages/admin/media.astro',
    ];

    for (const path of adminFiles) {
      const source = readFileSync(join(process.cwd(), path), 'utf8');
      expect(source, path).toContain("from '@/lib/admin-post-title'");
      expect(source, path).not.toContain("|| '无标题'");
    }

    expect(readFileSync(join(process.cwd(), 'src/pages/admin/index.astro'), 'utf8'))
      .toContain('adminContentDisplayTitle(post.title, post.text)');
    expect(readFileSync(join(process.cwd(), 'src/pages/admin/manage-pages.astro'), 'utf8'))
      .toContain('text: schema.contents.text');
    expect(readFileSync(join(process.cwd(), 'src/pages/admin/options-reading.astro'), 'utf8'))
      .toContain('text: schema.contents.text');
    expect(readFileSync(join(process.cwd(), 'src/pages/admin/write-page.astro'), 'utf8'))
      .toContain('adminContentDisplayTitle(row.title, row.text)');
    expect(readFileSync(join(process.cwd(), 'src/pages/admin/media.astro'), 'utf8'))
      .toContain('adminContentDisplayTitle(parentContent.title, parentContent.text)');
  });
});
