import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import router from './index.js';
import dotenv from 'dotenv';
import specs from './config/swagger.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

// API Documentation
app.use('/api-docs', 
  swaggerUi.serve, 
  swaggerUi.setup(specs, { explorer: true })
);

// API routes
app.use('/api', router);

// 404 handler (this should be after all other routes)
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Not Found',
        error: `Cannot ${req.method} ${req.path}`
    });
});

// Error handling middleware (should be last)
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // Handle validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // Default error handler
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    
    res.status(status).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { error: err.stack })
    });
});

export default app;
