import { Router } from 'express';
import authRoutes from './routes/authRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import mpesaRoutes from './routes/mpesaRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import themeRoutes from './routes/themeRoutes.js';

const router = Router();

router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Mount all routes directly under /api
router.use('/auth', authRoutes);
router.use('/offers', offerRoutes);
router.use('/mpesa', mpesaRoutes);
router.use('/transactions', transactionRoutes);
router.use('/theme', themeRoutes);

// 404 handler
router.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        path: req.originalUrl
    });
});

router.use((err, req, res, next) => {
    console.error('Error:', err);
    
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    
    res.status(status).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { error: err.stack })
    });
});

export default router;
