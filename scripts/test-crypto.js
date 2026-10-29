const fs = require('fs');
const zlib = require('zlib');
const crypto = require('crypto');

const MAGIC_HEADER = Buffer.from([0x46, 0x41, 0x4d, 0x42, 0x31]); // "FAMB1"
const PBKDF2_ITERATIONS = 600000;
const KEY_LEN = 32;

function decryptBlobSync(buffer, password) {
  if (buffer.length < 34) throw new Error('Short blob');
  for (let i = 0; i < 5; i++) {
    if (buffer[i] !== MAGIC_HEADER[i]) throw new Error('Invalid magic');
  }
  const version = buffer[5];
  const salt = buffer.slice(6, 22);
  const iv = buffer.slice(22, 34);
  const ciphertextAndTag = buffer.slice(34);
  const ciphertext = ciphertextAndTag.slice(0, ciphertextAndTag.length - 16);
  const tag = ciphertextAndTag.slice(ciphertextAndTag.length - 16);

  const key = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LEN, 'sha256');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decryptedGzip = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return zlib.gunzipSync(decryptedGzip);
}

console.log('🧪 ТЕСТИРОВАНИЕ КРИПТОГРАФИЧЕСКИХ ГАРАНТИЙ...\n');

// 1. Тест студенческого пароля
const metaBuf = fs.readFileSync('metadata.bin');
try {
  const decMeta = decryptBlobSync(metaBuf, 'famlovesmath');
  const metaObj = JSON.parse(decMeta.toString('utf8'));
  console.log('✅ 1. Студенческий пароль (famlovesmath) успешно расшифровал metadata.bin!');
  console.log(`   Найдено предметов: ${metaObj.subjects.length}, лекций: ${metaObj.lectures.length}`);
} catch (e) {
  console.error('❌ 1. Ошибка расшифровки metadata.bin:', e.message);
  process.exit(1);
}

// 2. Тест изоляции админки: студент НЕ МОЖЕТ расшифровать admin.bin
const adminBuf = fs.readFileSync('admin.bin');
try {
  decryptBlobSync(adminBuf, 'famlovesmath');
  console.error('❌ 2. КРИТИЧЕСКАЯ УЯЗВИМОСТЬ: Студент смог расшифровать admin.bin!');
  process.exit(1);
} catch (e) {
  console.log('✅ 2. Изоляция админки подтверждена: студент не может расшифровать admin.bin (ошибка GCM auth tag)!');
}

// 3. Тест админ-пароля
try {
  const decAdmin = decryptBlobSync(adminBuf, 'excelsiorcatharsis');
  const adminObj = JSON.parse(decAdmin.toString('utf8'));
  console.log('✅ 3. Админ-пароль (excelsiorcatharsis) успешно расшифровал admin.bin!');
  if (!adminObj.sharedKeyHex) {
    throw new Error('sharedKeyHex отсутствует в admin.bin');
  }
  console.log('✅ 4. sharedKeyHex присутствует в админском каталоге для сквозного доступа к блобам лекций!');
} catch (e) {
  console.error('❌ 3. Ошибка админ-пароля:', e.message);
  process.exit(1);
}

console.log('\n🎉 ВСЕ КРИПТОГРАФИЧЕСКИЕ ТЕСТЫ ПРОЙДЕНЫ С УСПЕХОМ!');
