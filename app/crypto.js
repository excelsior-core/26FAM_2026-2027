/**
 * app/crypto.js - Бескомпромиссная клиентская криптография на WebCrypto API
 * Стандарт: PBKDF2-HMAC-SHA256 (600 000 итераций) + AES-256-GCM + DecompressionStream('gzip')
 * Бинарный формат блоба (.bin):
 *   [0..4]   MAGIC: "FAMB1" (5 байт)
 *   [5]      FORMAT VERSION: 0x01 (1 байт)
 *   [6..21]  KDF SALT: 16 байт
 *   [22..33] AES IV: 12 байт
 *   [34..]   CIPHERTEXT + 16-байтный auth tag AES-GCM
 */

export class VaultCrypto {
  static MAGIC = new Uint8Array([0x46, 0x41, 0x4d, 0x42, 0x31]); // "FAMB1"
  static VERSION = 1;
  static PBKDF2_ITERATIONS = 600000;

  /**
   * Генерация мастер-ключа AES-GCM из пароля и соли через PBKDF2
   * @param {string} password 
   * @param {Uint8Array} salt 
   * @returns {Promise<CryptoKey>}
   */
  static async deriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true, // extractable для безопасного сохранения в сессии
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Разбор и расшифровка бинарного blob-файла (.bin)
   * @param {ArrayBuffer} buffer 
   * @param {string|CryptoKey} keyOrPassword 
   * @returns {Promise<Uint8Array>}
   */
  static async decryptBlob(buffer, keyOrPassword) {
    const bytes = new Uint8Array(buffer);

    // Проверка magic header (5 байт)
    if (bytes.length < 34) {
      throw new Error('Файл слишком короткий или повреждён');
    }
    for (let i = 0; i < 5; i++) {
      if (bytes[i] !== this.MAGIC[i]) {
        throw new Error('Неверный заголовок blob (ожидается FAMB1)');
      }
    }

    const version = bytes[5];
    if (version !== this.VERSION) {
      throw new Error(`Неподдерживаемая версия blob: ${version}`);
    }

    const salt = bytes.slice(6, 22);   // 16 байт
    const iv = bytes.slice(22, 34);     // 12 байт
    const ciphertext = bytes.slice(34); // остаток: шифртекст + 16-байтный auth tag

    let key;
    if (typeof keyOrPassword === 'string') {
      key = await this.deriveKey(keyOrPassword, salt);
    } else {
      key = keyOrPassword;
    }

    // Дешифрование AES-GCM с проверкой аутентификационного тега
    let decryptedGzip;
    try {
      decryptedGzip = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        ciphertext
      );
    } catch (e) {
      throw new Error('Криптографическая ошибка: неверный пароль или нарушение целостности данных');
    }

    // Распаковка gzip через нативный DecompressionStream
    return await this.decompressGzip(decryptedGzip);
  }

  /**
   * Распаковка GZIP буфера
   * @param {ArrayBuffer} gzipBuffer 
   * @returns {Promise<Uint8Array>}
   */
  static async decompressGzip(gzipBuffer) {
    if (typeof DecompressionStream !== 'undefined') {
      const stream = new Response(gzipBuffer).body.pipeThrough(new DecompressionStream('gzip'));
      const decompressedBuffer = await new Response(stream).arrayBuffer();
      return new Uint8Array(decompressedBuffer);
    } else {
      throw new Error('Браузер не поддерживает DecompressionStream API');
    }
  }

  /**
   * Экспорт ключа в Base64 для безопасного хранения
   * @param {CryptoKey} key 
   * @returns {Promise<string>} base64
   */
  static async exportKeyRaw(key) {
    const raw = await crypto.subtle.exportKey('raw', key);
    let binary = '';
    const bytes = new Uint8Array(raw);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Импорт ключа из Base64 строки
   * @param {string} base64Key 
   * @returns {Promise<CryptoKey>}
   */
  static async importKeyRaw(base64Key) {
    const binary = atob(base64Key);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return await crypto.subtle.importKey(
      'raw',
      bytes,
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Шифрование пользовательских локальных данных (маргиналии, заметки)
   */
  static async encryptLocalData(key, text) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(text);
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encoded
    );
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    let bin = '';
    for (let i = 0; i < combined.length; i++) {
      bin += String.fromCharCode(combined[i]);
    }
    return btoa(bin);
  }

  /**
   * Расшифровка пользовательских локальных данных (маргиналии, заметки)
   */
  static async decryptLocalData(key, base64) {
    try {
      const bin = atob(base64);
      const combined = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {
        combined[i] = bin.charCodeAt(i);
      }
      const iv = combined.slice(0, 12);
      const ciphertext = combined.slice(12);
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        ciphertext
      );
      return new TextDecoder().decode(decrypted);
    } catch (e) {
      return null;
    }
  }
}
