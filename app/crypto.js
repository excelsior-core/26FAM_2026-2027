/**
 * app/crypto.js - Клиентская криптография на WebCrypto API
 * PBKDF2-SHA256 (600 000 итераций) + AES-256-GCM + DecompressionStream('gzip')
 * Формат blob: FAMB1 + 0x01 (version) + salt(16) + IV(12) + ciphertext+tag
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
      true, // extractable для возможности сохранения производного ключа (запомнить устройство)
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

    const salt = bytes.slice(6, 22); // 16 байт
    const iv = bytes.slice(22, 34);   // 12 байт
    const ciphertext = bytes.slice(34); // Остаток: шифртекст + 16-байтный auth tag

    let key;
    if (typeof keyOrPassword === 'string') {
      key = await this.deriveKey(keyOrPassword, salt);
    } else {
      key = keyOrPassword;
    }

    // Дешифрование AES-GCM
    let decryptedGzip;
    try {
      decryptedGzip = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        ciphertext
      );
    } catch (e) {
      throw new Error('Криптографическая ошибка: неверный ключ или повреждённые данные');
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
      throw new Error('Браузер не поддерживает DecompressionStream');
    }
  }

  /**
   * Экспорт ключа в raw bytes для сохранения в localStorage/sessionStorage
   * @param {CryptoKey} key 
   * @returns {Promise<string>} base64
   */
  static async exportKeyRaw(key) {
    const raw = await crypto.subtle.exportKey('raw', key);
    return btoa(String.fromCharCode(...new Uint8Array(raw)));
  }

  /**
   * Импорт ключа из сохраненного base64
   * @param {string} base64Key 
   * @returns {Promise<CryptoKey>}
   */
  static async importKeyRaw(base64Key) {
    const rawStr = atob(base64Key);
    const bytes = new Uint8Array(rawStr.length);
    for (let i = 0; i < rawStr.length; i++) {
      bytes[i] = rawStr.charCodeAt(i);
    }
    return await crypto.subtle.importKey(
      'raw',
      bytes,
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    );
  }
}
