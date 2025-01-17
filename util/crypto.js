const crypto = require('node:crypto');
const { randomString } = require('./util');
const publicRasKey = `-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDIAG7QOELSYoIJvTFJhMpe1s/gbjDJX51HBNnEl5HXqTW6lQ7LC8jr9fWZTwusknp+sVGzwd40MwP6U5yDE27M/X1+UR4tvOGOqp94TJtQ1EPnWGWXngpeIW5GxoQGao1rmYWAu6oi1z9XkChrsUdC6DJE5E221wf/4WLFxwAtRQIDAQAB\n-----END PUBLIC KEY-----`;

/**
 * MD5 加密
 * @param {BufferLike} data
 * @returns {string}
 */
function cryptoMd5(data) {
  const buffer = typeof data === 'object' ? JSON.stringify(data) : data;
  return crypto.createHash('md5').update(buffer).digest('hex');
}

/**
 * Sha1 加密
 * @param {BufferLike} data
 * @returns { string }
 */
function cryptoSha1(data) {
  const buffer = typeof data === 'object' ? JSON.stringify(data) : data;
  return crypto.createHash('sha1').update(buffer).digest('hex');
}

/**
 * AES 加密
 * @param {BufferLike} data 需要加密的数据
 * @param {{ key?:string, iv?: string } | undefined} opt
 * @returns {AesEncrypt | string}
 */
function cryptoAesEncrypt(data, opt) {
  if (typeof data === 'object') data = JSON.stringify(data);
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  let key,
    iv,
    tempKey = '';
  if (opt?.key && opt?.iv) {
    key = opt.key;
    iv = opt.iv;
  } else {
    tempKey = opt?.key || randomString(16).toLowerCase();
    key = cryptoMd5(tempKey).substring(0, 32);
    iv = key.substring(key.length - 16, key.length);
  }

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const dest = Buffer.concat([cipher.update(buffer), cipher.final()]);
  if (opt?.key && opt?.key) return dest.toString('hex');
  return { str: dest.toString('hex'), key: tempKey };
}

/**
 * AES 解密
 * @param {string} data
 * @param {string} key
 * @param {string?} iv
 * @returns {string | Record<string, string>}
 */
function cryptoAesDecrypt(data, key, iv) {
  if (!iv) key = cryptoMd5(key).substring(0, 32);
  iv = iv || key.substring(key.length - 16, key.length);
  const cipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const dest = Buffer.concat([cipher.update(data, 'hex'), cipher.final()]);
  try {
    return JSON.parse(dest.toString());
  } catch (e) {
    return dest.toString();
  }
}

/**
 * RSA加密
 * @param {BufferLike} data
 * @param {string?} publicKey
 * @returns {string} hex
 */
function cryptoRSAEncrypt(data, publicKey) {
  if (typeof data === 'object') data = JSON.stringify(data);
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const _buffer = Buffer.concat([buffer, Buffer.alloc(128 - buffer.length)]);
  publicKey = publicKey || publicRasKey;
  return crypto.publicEncrypt({ key: publicKey, padding: crypto.constants.RSA_NO_PADDING }, _buffer).toString('hex');
}

module.exports = { cryptoAesDecrypt, cryptoAesEncrypt, cryptoMd5, cryptoRSAEncrypt, cryptoSha1 };
