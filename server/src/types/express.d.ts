import 'express';
import { JwtPayload } from '../middlewares/auth.middleware.js';

declare module 'express' {
  interface Request {
    user?: JwtPayload;
  }
}
