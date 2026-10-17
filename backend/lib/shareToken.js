// Signed, expiring links for sharing documents with customers (no login).
// token = base64url(payload).base64url(HMAC-SHA256(payload, secret))
const crypto = require("crypto");

const secret = () => process.env.SHARE_SECRET || process.env.JWT_SECRET;
const b64 = (buf) => Buffer.from(buf).toString("base64url");

function signShare(payload, days = 30) {
  if (!secret()) throw new Error("JWT_SECRET is not set");
  const body = b64(JSON.stringify({ ...payload, exp: Date.now() + days * 864e5 }));
  const sig = b64(crypto.createHmac("sha256", secret()).update(body).digest());
  return `${body}.${sig}`;
}

function verifyShare(token) {
  if (!token || !secret()) return null;
  const [body, sig] = String(token).replace(/\.pdf$/, "").split(".");
  if (!body || !sig) return null;
  const expected = b64(crypto.createHmac("sha256", secret()).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!p.exp || p.exp < Date.now()) return null;
    return p;
  } catch {
    return null;
  }
}

module.exports = { signShare, verifyShare };
