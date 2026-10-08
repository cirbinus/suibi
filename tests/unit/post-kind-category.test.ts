import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(join(process.cwd(), 'src/pages/admin/write-post.astro'), 'utf8');

describe('suibi post-kind category selector', () => {
  it('defaults new posts to the suibi category by slug', () => {
    expect(source).toContain("category.slug === 'suibi'");
    expect(source).toContain('postCategories = [essayCategory.mid]');
  });

  it('renders suibi and biji as one radio group', () => {
    expect(source).toContain("cat.slug === 'suibi' || cat.slug === 'biji'");
    expect(source).toContain("type={isKindCategory ? 'radio' : 'checkbox'}");
    expect(source).toContain('name="category[]"');
  });
});
