import { describe, expect, it } from 'vitest';
import { extractInlineHashtagNames, linkifyInlineHashtags } from '@/lib/inline-hashtags';

describe('inline hashtags', () => {
  it('extracts natural Chinese and emoji hashtags without treating Markdown headings as tags', () => {
    const source = '<!--markdown--># 正文标题\n#生活 今天很好，#👨‍💻Coding 也方便。\n重复 #生活';
    expect(extractInlineHashtagNames(source)).toEqual(['生活', '👨‍💻Coding']);
  });

  it('ignores fenced code, inline code and URL fragments', () => {
    const source = '`#内联代码` https://example.com/#片段\n```ts\n#代码\n```\n正文 #有效';
    expect(extractInlineHashtagNames(source)).toEqual(['有效']);
  });

  it('links matching hashtags in rendered prose but not inside anchors or code', () => {
    const html = '<p>#生活 今天 <a href="/old">#生活</a> <code>#生活</code></p>';
    const linked = linkifyInlineHashtags(html, [
      { name: '生活', permalink: 'https://suibi.io/tag/%E7%94%9F%E6%B4%BB/' },
    ]);
    expect(linked).toContain('<a class="suibi-topic-highlight" href="https://suibi.io/tag/%E7%94%9F%E6%B4%BB/">#生活</a> 今天');
    expect(linked).toContain('<a href="/old">#生活</a>');
    expect(linked).toContain('<code>#生活</code>');
  });
});
