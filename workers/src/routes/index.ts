import { Hono } from 'hono';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import orderRoutes from './order.routes';
import productRoutes from './product.routes';
import uploadRoutes from './upload.routes';

const routes = new Hono();

// 注册路由
routes.route('/auth', authRoutes);
routes.route('/users', userRoutes);
routes.route('/orders', orderRoutes);
routes.route('/products', productRoutes);
routes.route('/uploads', uploadRoutes);

export default routes;
