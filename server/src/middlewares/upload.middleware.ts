import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// 上传目录
const UPLOAD_DIR = 'uploads/certifications';

// 确保目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 允许的文件类型
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/pdf',
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];

// 文件大小限制：5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * 文件魔数（Magic Number）签名表
 * 用于验证文件的真实类型，防止 MIME 类型伪造
 */
const FILE_SIGNATURES: Record<string, { signature: Buffer; offset: number }[]> = {
  'image/jpeg': [
    { signature: Buffer.from([0xFF, 0xD8, 0xFF]), offset: 0 }, // JPEG 起始标记
  ],
  'image/png': [
    { signature: Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), offset: 0 }, // PNG 签名
  ],
  'application/pdf': [
    { signature: Buffer.from([0x25, 0x50, 0x44, 0x46]), offset: 0 }, // %PDF
  ],
};

/**
 * 通过文件魔数验证文件真实类型
 * @param filePath 文件路径
 * @param expectedMime 期望的 MIME 类型
 * @returns 是否匹配
 */
function verifyFileSignature(filePath: string, expectedMime: string): boolean {
  try {
    const fd = fs.openSync(filePath, 'r');
    const signatures = FILE_SIGNATURES[expectedMime];

    if (!signatures) {
      // 如果没有定义签名，则无法验证，保守拒绝
      return false;
    }

    for (const { signature, offset } of signatures) {
      const buffer = Buffer.alloc(signature.length);
      fs.readSync(fd, buffer, 0, signature.length, offset);

      if (buffer.equals(signature)) {
        fs.closeSync(fd);
        return true;
      }
    }

    fs.closeSync(fd);
    return false;
  } catch {
    return false;
  }
}

/**
 * 生成安全文件名
 * 格式：{userId}_{timestamp}_{随机8位}_{原始文件名}
 */
function generateFileName(userId: string, originalName: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  const ext = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, ext)
    .replace(/[^a-zA-Z0-9一-龥]/g, '_') // 只保留字母数字中文
    .substring(0, 30); // 限制长度
  return `${userId}_${timestamp}_${random}_${baseName}${ext}`;
}

/**
 * 认证文件上传存储配置
 * 使用内存存储先验证文件真实性，再写入磁盘
 */
export const certificationUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('不支持的文件类型，仅支持 JPG、PNG、PDF'));
    }

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error('不支持的文件扩展名，仅支持 .jpg、.jpeg、.png、.pdf'));
    }

    cb(null, true);
  },
});

/**
 * 验证并保存上传的文件
 * 通过文件魔数验证真实类型，防止 MIME 类型伪造
 */
export function validateAndSaveFile(
  file: Express.Multer.File,
  userId: string
): { success: boolean; filename?: string; error?: string } {
  // 1. 从文件缓冲区读取魔数签名
  const buffer = file.buffer;

  // 2. 验证文件魔数
  let isValidType = false;
  const declaredMime = file.mimetype;

  if (declaredMime === 'image/jpeg' || declaredMime === 'image/jpg') {
    // JPEG: FF D8 FF
    if (buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      isValidType = true;
    }
  } else if (declaredMime === 'image/png') {
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    if (buffer.length >= 8 && buffer.subarray(0, 8).equals(pngSignature)) {
      isValidType = true;
    }
  } else if (declaredMime === 'application/pdf') {
    // PDF: 25 50 44 46 (%PDF)
    const pdfSignature = Buffer.from([0x25, 0x50, 0x44, 0x46]);
    if (buffer.length >= 4 && buffer.subarray(0, 4).equals(pdfSignature)) {
      isValidType = true;
    }
  }

  if (!isValidType) {
    return {
      success: false,
      error: '文件内容与声明的类型不匹配，可能是伪造的文件类型',
    };
  }

  // 3. 生成安全文件名并保存
  const filename = generateFileName(userId, file.originalname);
  const filePath = path.join(UPLOAD_DIR, filename);

  try {
    fs.writeFileSync(filePath, buffer);
    return { success: true, filename };
  } catch (err) {
    return { success: false, error: '文件保存失败' };
  }
}

/**
 * 获取文件的公开访问URL
 */
export function getFileUrl(filename: string): string {
  return `/uploads/certifications/${filename}`;
}

/**
 * 删除文件
 */
export function deleteFile(filename: string): boolean {
  try {
    const filePath = path.join(UPLOAD_DIR, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
