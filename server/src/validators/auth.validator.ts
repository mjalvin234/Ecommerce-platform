import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string()
    .min(8, '密码至少8位')
    .regex(/[a-zA-Z]/, '密码必须包含字母')
    .regex(/[0-9]/, '密码必须包含数字'),
  companyName: z.string().min(2, '公司名称至少2个字符'),
  role: z.enum(['buyer', 'seller'], {
    errorMap: () => ({ message: '角色必须是 buyer 或 seller' }),
  }),
  emailCode: z.string().length(6, '验证码必须是6位').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '请输入密码'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
