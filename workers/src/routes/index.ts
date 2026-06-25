import { Hono } from 'hono';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import orderRoutes from './order.routes';
import productRoutes from './product.routes';
import uploadRoutes from './upload.routes';
import adminRoutes from './admin.routes';
import inventoryRoutes from './inventory.routes';
import negotiationRoutes from './negotiation.routes';
import messageRoutes from './message.routes';
import adviceRoutes from './advice.routes';
import invoiceRoutes from './invoice.routes';
import emailRoutes from './email.routes';
import batchRoutes from './batch.routes';
import bomRoutes from './bom.routes';
import systemRoutes from './system.routes';
import searchRoutes from './search.routes';
import favoritesRoutes from './favorites.routes';
import creditRoutes from './credit.routes';
import paymentRoutes from './payment.routes';

const routes = new Hono();

// 注册路由
routes.route('/auth', authRoutes);
routes.route('/users', userRoutes);
routes.route('/orders', orderRoutes);
routes.route('/products', productRoutes);
routes.route('/uploads', uploadRoutes);
routes.route('/admin', adminRoutes);
routes.route('/inventory', inventoryRoutes);
routes.route('/negotiations', negotiationRoutes);
routes.route('/messages', messageRoutes);
routes.route('/advice', adviceRoutes);
routes.route('/invoices', invoiceRoutes);
routes.route('/email', emailRoutes);
routes.route('/batch-upload', batchRoutes);
routes.route('/bom', bomRoutes);
routes.route('/system-config', systemRoutes);
routes.route('/search', searchRoutes);
routes.route('/favorites', favoritesRoutes);
routes.route('/credit', creditRoutes);
routes.route('/payments', paymentRoutes);

export default routes;
