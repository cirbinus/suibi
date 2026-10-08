/**
 * Same-origin checks for state-changing requests.
 *
 * On Cloudflare the worker's `request.url` carries the public scheme, so
 * comparing the Origin/Referer header against the configured site URL works.
 * Behind a TLS-terminating reverse proxy (Caddy → wrangler dev over plain
 * http) two things break the naive comparison:
 *
 *   1. the worker only ever sees `http://<host>`, never `https://<host>`; and
 *   2. workerd normalises a *same-host* `Origin`/`Referer` header to the
 *      request's own origin, so `https://suibi.io` is observed as
 *      `http://suibi.io` while a foreign origin (`https://evil.example`) is
 *      passed through untouched.
 *
 * The scheme in these headers is therefore unusable for same-site requests.
 * We compare hosts instead: a cross-site attacker cannot make the browser
 * send our host in `Origin`, so host equality is still a sound CSRF anchor —
 * and `X-Forwarded-Proto`, when present, must agree with the configured site
 * scheme so an unexpected downgrade is surfaced rather than silently trusted.
 */

function toOrigin(value: string): string {
  try {
    return new URL(value).origin;
  } catch {
    return '';
  }
}

function forwardedProto(request: Request): string {
  const raw = request.headers.get('x-forwarded-proto') || '';
  return raw.split(',')[0]!.trim().toLowerCase().replace(/:$/, '');
}

export function isTrustedSameOrigin(request: Request, siteUrl: string): boolean {
  if (!siteUrl) return false;
  const expected = toOrigin(siteUrl);
  if (!expected) return false;

  let expectedHost = '';
  let expectedProto = '';
  try {
    const parsed = new URL(expected);
    expectedHost = parsed.host;
    expectedProto = parsed.protocol.replace(':', '');
  } catch {
    return false;
  }
  if (!expectedHost) return false;

  // A proxy advertising a scheme that disagrees with the configured site URL
  // means a misconfiguration we do not want to paper over.
  const proto = forwardedProto(request);
  if (proto && proto !== expectedProto) return false;

  const check = (raw: string | null): boolean | null => {
    if (!raw) return null;
    const actual = toOrigin(raw);
    if (!actual) return false;
    if (actual === expected) return true;
    try {
      return new URL(actual).host === expectedHost;
    } catch {
      return false;
    }
  };

  const origin = check(request.headers.get('origin'));
  if (origin !== null) return origin;
  const referer = check(request.headers.get('referer'));
  if (referer !== null) return referer;
  return false;
}
