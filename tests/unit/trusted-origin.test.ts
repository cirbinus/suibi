import { describe, expect, it } from 'vitest';
import { isTrustedSameOrigin } from '@/lib/trusted-origin';

const mk = (headers: Record<string, string>) =>
  new Request('http://suibi.io/api/users/login', { method: 'POST', headers });

describe('isTrustedSameOrigin', () => {
  it('accepts an exact origin match', () => {
    expect(isTrustedSameOrigin(mk({ origin: 'https://suibi.io' }), 'https://suibi.io')).toBe(true);
  });

  it('accepts the same host when the proxy downgraded the observed scheme', () => {
    // Caddy terminates TLS, workerd sees http:// and rewrites a same-host
    // Origin to that scheme, so the scheme must not be part of the check.
    const request = mk({ origin: 'http://suibi.io', 'x-forwarded-proto': 'https' });
    expect(isTrustedSameOrigin(request, 'https://suibi.io')).toBe(true);
  });

  it('falls back to the referer when origin is absent', () => {
    const request = mk({ referer: 'http://suibi.io/admin/login', 'x-forwarded-proto': 'https' });
    expect(isTrustedSameOrigin(request, 'https://suibi.io')).toBe(true);
  });

  it('rejects a different host', () => {
    expect(isTrustedSameOrigin(mk({ origin: 'https://evil.example' }), 'https://suibi.io')).toBe(false);
  });

  it('rejects a look-alike host', () => {
    expect(isTrustedSameOrigin(mk({ origin: 'https://suibi.io.evil.example' }), 'https://suibi.io')).toBe(false);
  });

  it('rejects when the proxy advertises a scheme that disagrees with the site url', () => {
    const request = mk({ origin: 'https://suibi.io', 'x-forwarded-proto': 'http' });
    expect(isTrustedSameOrigin(request, 'https://suibi.io')).toBe(false);
  });

  it('rejects when both headers are missing', () => {
    expect(isTrustedSameOrigin(mk({}), 'https://suibi.io')).toBe(false);
  });

  it('rejects an unparseable site url', () => {
    expect(isTrustedSameOrigin(mk({ origin: 'https://suibi.io' }), 'not-a-url')).toBe(false);
  });
});
