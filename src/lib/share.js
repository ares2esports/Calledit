// Encode/decode a bracket into a URL-safe string for shareable links
const b64url = {
  enc: (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))),
};

export function encodeBracket(name, picks, tiebreaker) {
  return b64url.enc(JSON.stringify({ n: name, p: picks, t: tiebreaker }));
}

export function decodeBracket(data) {
  try {
    const { n, p, t } = JSON.parse(b64url.dec(data));
    return { name: n || 'Shared bracket', picks: p || {}, tiebreaker: t ?? null };
  } catch {
    return null;
  }
}
