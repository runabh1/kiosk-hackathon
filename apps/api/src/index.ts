import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './modules/auth/routes';
import billingRoutes from './modules/billing/routes';
import connectionRoutes from './modules/connection/routes';
import grievanceRoutes from './modules/grievance/routes';
import notificationRoutes from './modules/notification/routes';
import adminRoutes from './modules/admin/routes';
import sigmRoutes from './modules/sigm/routes';
import paymentRoutes from './modules/payment/routes';
import uploadRoutes from './modules/upload/routes';
import serviceRequestRoutes from './modules/service-request/routes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SUVIDHA API is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/grievances', grievanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sigm', sigmRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/service-requests', serviceRequestRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SUVIDHA API running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
});

export default app;
