import { randomBytes, createCipheriv, createDecipheriv, pbkdf2Sync, createHash } from 'node:crypto';
export const id = () => randomBytes(16).toString('hex');
export const sha = data => createHash('sha256').update(data).digest('hex');
export const aad = (kind, objectId) => Buffer.from(`FAM|1|${kind}|${objectId}`);
export function seal(data, key, kind, objectId) {
  const nonce = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, nonce);
  cipher.setAAD(aad(kind, objectId));
  const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
  return Buffer.concat([Buffer.from([1]), nonce, ciphertext, cipher.getAuthTag()]);
}
export function unseal(data, key, kind, objectId) {
  if (data[0] !== 1 || data.length < 29) throw Error('Неизвестный формат объекта');
  const cipher = createDecipheriv('aes-256-gcm', key, data.subarray(1, 13));
  cipher.setAAD(aad(kind, objectId)); cipher.setAuthTag(data.subarray(-16));
  return Buffer.concat([cipher.update(data.subarray(13, -16)), cipher.final()]);
}
export const derive = (secret, salt, rounds) => pbkdf2Sync(secret, salt, rounds, 32, 'sha256');
export function newAccess(name, rounds = 600000) {
  const uid = id(), secret = randomBytes(32).toString('base64url'), salt = randomBytes(24);
  const started = performance.now(); const key = derive(secret, salt, rounds);
  return { user: { id: uid, name, salt: salt.toString('base64'), rounds, measuredMs: Math.round(performance.now()-started), wrappingKey: key.toString('base64'), active: true, created: new Date().toISOString() }, code: `FAM.${uid}.${secret}` };
}
