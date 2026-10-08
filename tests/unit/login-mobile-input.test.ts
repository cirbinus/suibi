/**
 * Mobile-only login failures: iOS/Android keyboards capitalise the first letter
 * of a text input and may autocorrect it. The backend matches credentials
 * strictly, so the fix belongs in the form: tell the keyboard not to touch it.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const page = readFileSync(join(process.cwd(), 'src/pages/admin/login.astro'), 'utf8');

function input(attrs: string) {
  const match = page.match(new RegExp(`<input[^>]*${attrs}[^>]*>`));
  return match ? match[0] : '';
}

describe('login form is mobile-keyboard safe', () => {
  it('never lets the keyboard capitalise or autocorrect the account field', () => {
    const name = input('id="name"');
    expect(name).toBeTruthy();
    expect(name).toContain('autocapitalize="none"');
    expect(name).toContain('autocorrect="off"');
    expect(name).toContain('spellcheck="false"');
    expect(name).toContain('autocomplete="username"');
  });

  it('never lets the keyboard capitalise or autocorrect the password field', () => {
    const password = input('id="password"');
    expect(password).toBeTruthy();
    expect(password).toContain('type="password"');
    expect(password).toContain('autocapitalize="none"');
    expect(password).toContain('autocorrect="off"');
    expect(password).toContain('spellcheck="false"');
    expect(password).toContain('autocomplete="current-password"');
  });

  it('keeps the backend strict — no trimming or case folding of the name', () => {
    const route = readFileSync(join(process.cwd(), 'src/pages/api/users/login.ts'), 'utf8');
    expect(route).toContain("const name = formData.get('name')?.toString() || '';");
    expect(route).not.toContain('fallback to a case-insensitive');
    expect(route).not.toContain('?.toString() || \'\').trim()');
    expect(route).not.toMatch(/lower\(\$\{schema\.users\.name\}\)/);
  });
});
