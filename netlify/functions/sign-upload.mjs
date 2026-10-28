import { createHash, randomUUID } from 'node:crypto';
import { firebaseConfig, adminUid, cloudName } from '../../firebase-config.js';

export default async request => {
  const reply = (status, message) => Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
  if (request.method !== 'POST') return reply(405, 'Yalnızca POST desteklenir.');
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return reply(401, 'Giriş yapmalısınız.');
  try {
    const verification = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token }), signal: AbortSignal.timeout(10000),
    });
    if (!verification.ok) return reply(401, 'Oturum geçersiz. Tekrar giriş yapın.');
    const identity = await verification.json();
    const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    if (identity.users?.[0]?.localId !== adminUid || claims.aud !== firebaseConfig.projectId) return reply(403, 'Yetkiniz yok.');
    const { productId } = await request.json();
    if (!Number.isInteger(productId) || productId < 0 || productId > 71) return reply(400, 'Geçersiz ürün.');
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const secret = process.env.CLOUDINARY_API_SECRET;
    if (!apiKey || !secret) return reply(503, 'Netlify görsel yükleme ayarları eksik.');
    const params = {
      allowed_formats: 'jpg,jpeg,png,webp,avif',
      public_id: `menu/product-${productId}-${randomUUID()}`,
      timestamp: Math.floor(Date.now() / 1000),
      transformation: 'c_limit,h_1600,w_1600/f_webp',
    };
    const canonical = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
    const signature = createHash('sha1').update(canonical + secret).digest('hex');
    return Response.json({ params, signature, apiKey, cloudName }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return reply(500, 'Yükleme hazırlanamadı. Tekrar deneyin.'); }
};
