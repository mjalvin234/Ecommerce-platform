import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from './error.middleware.js';

type ValidationSource = 'body' | 'query' | 'params';

export const validate = (
  schema: ZodSchema,
  source: ValidationSource = 'body'
) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = source === 'body' ? req.body :
                   source === 'query' ? req.query : req.params;

      const validated = await schema.parseAsync(data);

      if (source === 'body') req.body = validated;
      else if (source === 'query') req.query = validated;
      else req.params = validated;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(new ValidationError(`验证失败: ${messages}`));
      } else {
        next(error);
      }
    }
  };
};
