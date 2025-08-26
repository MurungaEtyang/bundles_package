import { Router } from 'express';
import MpesaCredentials from '../controller/MpesaCredentials.js';
import PaymentController from '../controller/Payment.js';
import { authenticateJwt } from '../middleware/authenticateJwt.js';

const router = Router();


/**
 * @swagger
 * /mpesa/credentials/latest:
 *   get:
 *     summary: Get latest M-Pesa credentials
 *     description: Retrieve the latest M-Pesa credentials (protected route)
 *     tags: [M-Pesa]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved M-Pesa credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     short_code:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     callback_url:
 *                       type: string
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       404:
 *         description: No M-Pesa credentials found
 */
router.get('/credentials/latest', authenticateJwt, async (req, res, next) => {
    try {
        const credentials = await MpesaCredentials.getCredentials();
        if (!credentials) {
            return res.status(404).json({
                success: false,
                message: 'No M-Pesa credentials found'
            });
        }
        
        // Don't expose sensitive data in the response
        const { id, short_code, created_at } = credentials;
        res.json({
            success: true,
            data: {
                id,
                short_code,
                created_at,
                callback_url: MpesaCredentials.getCallbackUrl()
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /mpesa/credentials:
 *   post:
 *     summary: Add new M-Pesa credentials
 *     description: Add new M-Pesa credentials (protected route)
 *     tags: [M-Pesa]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - consumer_key
 *               - consumer_secret
 *               - short_code
 *               - pass_key
 *             properties:
 *               consumer_key:
 *                 type: string
 *               consumer_secret:
 *                 type: string
 *               short_code:
 *                 type: string
 *               pass_key:
 *                 type: string
 *     responses:
 *       201:
 *         description: M-Pesa credentials saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized - Missing or invalid token
 */
router.post('/credentials', authenticateJwt, async (req, res, next) => {
    try {
        const { consumer_key, consumer_secret, short_code, pass_key } = req.body;
        
        if (!consumer_key || !consumer_secret || !short_code || !pass_key) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: consumer_key, consumer_secret, short_code, pass_key'
            });
        }

        await MpesaCredentials.addCredentials({
            consumer_key,
            consumer_secret,
            short_code,
            pass_key
        });

        res.status(201).json({
            success: true,
            message: 'M-Pesa credentials saved successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /mpesa/stk-push:
 *   post:
 *     summary: Initiate STK push payment
 *     description: Initiate an M-Pesa STK push payment for a package
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - packageId
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Customer's phone number (can start with 0, 254, or +254)
 *                 example: 254712345678
 *               packageId:
 *                 type: integer
 *                 description: ID of the package to purchase
 *                 example: 1
 *     responses:
 *       200:
 *         description: STK push initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     MerchantRequestID:
 *                       type: string
 *                     CheckoutRequestID:
 *                       type: string
 *                     ResponseCode:
 *                       type: string
 *                     ResponseDescription:
 *                       type: string
 *                     CustomerMessage:
 *                       type: string
 *                 package:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     amount:
 *                       type: number
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: Package not found
 */
router.post('/stk-push', async (req, res, next) => {
    try {
        const { phone, packageId } = req.body;
        
        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        if (!packageId) {
            return res.status(400).json({
                success: false,
                message: 'Package ID is required'
            });
        }

        try {
            const result = await PaymentController.stkPush(phone, packageId);
            res.json(result);
        } catch (error) {
            console.error('STK Push Error:', error.message);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to initiate STK push',
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    } catch (error) {
        next(error);
    }
});

// M-Pesa callback URL (public)
router.post('/callback', async (req, res) => {
    try {
        const callbackData = req.body;
        console.log('M-Pesa Callback Received:', callbackData);
        
        // TODO: Process the callback data (save to database, update payment status, etc.)
        
        // Always respond with success to M-Pesa
        res.status(200).json({
            ResultCode: '0',
            ResultDesc: 'Callback received successfully'
        });
    } catch (error) {
        console.error('Error processing M-Pesa callback:', error);
        res.status(200).json({
            ResultCode: '1',
            ResultDesc: 'Error processing callback'
        });
    }
});

export default router;
