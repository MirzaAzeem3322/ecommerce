import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payments.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: config.clientUrl }));
app.use(morgan('dev'));

// Payments first: the Stripe webhook needs the raw body, before express.json() parses it
app.use('/api/payments', paymentRoutes);

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
