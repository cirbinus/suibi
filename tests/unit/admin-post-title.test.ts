import { adminPostDisplayTitle } from '@/lib/admin-post-title';
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

  it('wires body text into the manage-posts table fallback', () => {
    const source = readFileSync(join(process.cwd(), 'src/pages/admin/manage-posts.astro'), 'utf8');
    expect(source).toContain('text: schema.contents.text');
    expect(source).toContain('adminPostDisplayTitle(post.title, post.text)');
  });
});
