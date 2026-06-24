import { Hono } from 'hono';
import { authMiddleware } from '../middlewares/auth.middleware';
import { v4 as uuidv4 } from 'uuid';

const uploadRoutes = new Hono();

uploadRoutes.use('*', authMiddleware);

// 上传文件到 R2
uploadRoutes.post('/', async (c) => {
  try {
    const user = c.get('user');
    const contentType = c.req.header('Content-Type') || '';

    if (!contentType.includes('multipart/form-data')) {
      return c.json({
        success: false,
        error: { message: '请使用 multipart/form-data 格式上传' },
      }, 400);
    }

    const body = await c.req.parseBody();
    const file = body['file'] as File;

    if (!file) {
      return c.json({
        success: false,
        error: { message: '未找到上传文件' },
      }, 400);
    }

    // 检查文件大小（最大 10MB）
    if (file.size > 10 * 1024 * 1024) {
      return c.json({
        success: false,
        error: { message: '文件大小不能超过 10MB' },
      }, 400);
    }

    // 生成文件名
    const ext = file.name.split('.').pop();
    const filename = `${user.id}/${uuidv4()}.${ext}`;

    // 上传到 R2
    await c.env.UPLOADS.put(filename, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        userId: user.id,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    // 返回访问 URL
    const publicUrl = c.env.ENVIRONMENT === 'production'
      ? `https://your-workers-url.workers.dev/uploads/${filename}`  // 部署时修改
      : `http://localhost:8787/uploads/${filename}`;

    return c.json({
      success: true,
      data: {
        filename,
        url: publicUrl,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error) {
    console.error('上传错误:', error);
    return c.json({
      success: false,
      error: { message: '上传失败' },
    }, 500);
  }
});

// 获取文件
uploadRoutes.get('/:userId/:filename', async (c) => {
  const { userId, filename } = c.req.param();
  const key = `${userId}/${filename}`;

  const object = await c.env.UPLOADS.get(key);

  if (!object) {
    return c.json({
      success: false,
      error: { message: '文件不存在' },
    }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);

  return new Response(object.body, { headers });
});

// 删除文件
uploadRoutes.delete('/:userId/:filename', async (c) => {
  const user = c.get('user');
  const { userId, filename } = c.req.param();

  // 验证权限
  if (user.id !== userId && user.role !== 'admin') {
    return c.json({
      success: false,
      error: { message: '无权删除此文件' },
    }, 403);
  }

  const key = `${userId}/${filename}`;

  await c.env.UPLOADS.delete(key);

  return c.json({
    success: true,
    message: '删除成功',
  });
});

export default uploadRoutes;
