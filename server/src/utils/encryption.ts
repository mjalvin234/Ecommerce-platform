import crypto from 'crypto';

// 加密密钥（必须从环境变量配置）
const ALGORITHM = 'aes-256-cbc';

// 获取加密密钥
const getEncryptionKey = (): string => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY 环境变量未配置，请在 .env 文件中设置');
  }
  if (key.length < 16) {
    throw new Error('ENCRYPTION_KEY 长度至少16位');
  }
  return key;
};

// 确保密钥长度正确（32字节）
const getKey = (): Buffer => {
  const key = crypto.createHash('sha256').update(getEncryptionKey()).digest();
  return key;
};

/**
 * 加密敏感数据
 * @param text 要加密的文本
 * @returns 加密后的字符串（iv:encryptedData 格式）
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // 返回格式：iv:encryptedData
  return `${iv.toString('hex')}:${encrypted}`;
}


/**
 * 验证身份证号格式
 * @param idCard 身份证号
 * @returns 是否有效
 */
export function validateIdCard(idCard: string): boolean {
  // 18位身份证号正则
  const reg = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
  return reg.test(idCard);
}
