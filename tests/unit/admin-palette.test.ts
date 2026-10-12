import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(process.cwd(), 'public/css/admin.css'), 'utf8');

describe('admin warm palette', () => {
  it('shares the exact warm-neutral design tokens used by the biji reference theme', () => {
    expect(css).toContain('--admin-bg: #fff;');
    expect(css).toContain('--admin-surface: #f7f6f3;');
    expect(css).toContain('--admin-surface-strong: #f2f0ec;');
    expect(css).toContain('--admin-text: #242321;');
    expect(css).toContain('--admin-body: #3d3a37;');
    expect(css).toContain('--admin-muted: #6f6c68;');
    expect(css).toContain('--admin-faint: #a09c96;');
    expect(css).toContain('--admin-border: #ebe8e3;');
    expect(css).toContain('--admin-accent: #685f57;');
    expect(css).toContain('--admin-hover: #faf9f7;');
  });

  it('uses warm neutrals for the page, links, controls, and navigation', () => {
    expect(css).toContain('background: var(--admin-surface); color: var(--admin-body);');
    expect(css).toContain('a { color: var(--admin-accent);');
    expect(css).toContain('.primary { border: none; background-color: var(--admin-accent);');
    expect(css).toContain('.typecho-head-nav { padding: 0 10px; background: var(--admin-nav);');
    expect(css).not.toMatch(/#(?:467b96|499bc3|292d33|202328|6da1bb)/i);
  });

  it('does not reintroduce the old cool-blue palette in admin plugin surfaces', () => {
    const files = [
      'src/plugins/typecho-plugin-engine/index.ts',
      'src/plugins/typecho-plugin-engine/admin-page.ts',
      'src/plugins/typecho-plugin-notifier/admin-page.ts',
      'src/plugins/typecho-plugin-notes/admin.ts',
    ];
    const pluginCss = files
      .map((file) => readFileSync(join(process.cwd(), file), 'utf8'))
      .join('\n');

    expect(pluginCss).not.toMatch(/#(?:467b96|499bc3|315f78|64748b|536174|3f4b5f|364153|718096|7f8da1|8793a4|a0aaba|a6afbc|9aa5b5|dfe4ec|e7eaf0|edf0f4|e2e7ef|eef1f5|f7f9fb)/i);
  });
});
