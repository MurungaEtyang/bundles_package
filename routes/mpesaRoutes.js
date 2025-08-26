import { Router } from 'express';
import MpesaCredentials from '../controller/MpesaCredentials.js';
import PaymentController from '../controller/Payment.js';
import { authenticateJwt } from '../middleware/authenticateJwt.js';
import pool from "../config/config.js";

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
    const client = await pool.connect();
    
    try {
        const callbackData = req.body;
        console.log('M-Pesa Callback Received:', JSON.stringify(callbackData, null, 2));
        
        // Start transaction
        await client.query('BEGIN');
        
        const stkCallback = callbackData.Body?.stkCallback;
        
        // Extract data from callback
        const merchantRequestId = stkCallback.MerchantRequestID;
        const checkoutRequestId = stkCallback.CheckoutRequestID;
        const resultCode = stkCallback.ResultCode?.toString() || '1';
        const resultDesc = stkCallback.ResultDesc || 'No description';
        const isSuccess = resultCode === '0';
        
        // Initialize variables for callback data
        let amount = 0;
        let mpesaReceiptNumber = null;
        let transactionDate = null;
        let phoneNumber = null;
        let accountReference = null;
        
        // Try to get the existing transaction from database
        try {
            const existingTx = await client.query(
                'SELECT amount, phone_number, account_reference FROM transactions WHERE merchant_request_id = $1 AND checkout_request_id = $2',
                [merchantRequestId, checkoutRequestId]
            );
            
            if (existingTx.rows.length > 0) {
                amount = parseFloat(existingTx.rows[0].amount) || 0;
                phoneNumber = phoneNumber || existingTx.rows[0].phone_number;
                accountReference = accountReference || existingTx.rows[0].account_reference;
                console.log(`ℹ️ Found existing transaction with amount: ${amount}`);
            }
        } catch (error) {
            console.error('Error fetching existing transaction:', error);
        }
        
        // Try to get transaction details from database if we don't have the phone number
        if (!phoneNumber && merchantRequestId) {
            try {
                const existingTx = await client.query(
                    'SELECT phone_number, account_reference FROM transactions WHERE merchant_request_id = $1',
                    [merchantRequestId]
                );
                
                if (existingTx.rows.length > 0) {
                    phoneNumber = existingTx.rows[0].phone_number;
                    accountReference = accountReference || existingTx.rows[0].account_reference;
                }
            } catch (dbError) {
                console.error('Error fetching existing transaction:', dbError);
                // Continue with the update even if we can't find the existing transaction
            }
        }
        
        // Parse callback metadata if payment was successful and we have the metadata
        if (stkCallback.CallbackMetadata) {
            const metadata = stkCallback.CallbackMetadata.Item;
            
            metadata.forEach(item => {
                if (!item || !item.Name) return;
                
                switch(item.Name) {
                    case 'Amount':
                        if (item.Value) {
                            amount = parseFloat(item.Value);
                            console.log(`💰 Extracted amount from callback: ${amount}`);
                        }
                        break;
                    case 'MpesaReceiptNumber':
                        mpesaReceiptNumber = item.Value || null;
                        break;
                    case 'PhoneNumber':
                        phoneNumber = item.Value ? String(item.Value).replace(/^0/, '254') : null;
                        break;
                    case 'AccountReference':
                        accountReference = item.Value || null;
                        break;
                    case 'TransactionDate':
                        // Convert M-Pesa timestamp to ISO format (YYYYMMDDHHmmss -> ISO)
                        if (item.Value) {
                            const dateStr = String(item.Value);
                            const year = dateStr.substring(0, 4);
                            const month = dateStr.substring(4, 6);
                            const day = dateStr.substring(6, 8);
                            const hour = dateStr.substring(8, 10);
                            const minute = dateStr.substring(10, 12);
                            const second = dateStr.substring(12, 14);
                            transactionDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+03:00`).toISOString();
                        }
                        break;
                }
            });
        }
        
        // If we still don't have a phone number, use a default value to avoid DB constraint violation
        if (!phoneNumber) {
            console.warn('⚠️ No phone number found in callback or database, using default');
            phoneNumber = '254000000000'; // Default phone number
        }
        
        // Save transaction to database
        const query = `
            INSERT INTO transactions (
                merchant_request_id,
                checkout_request_id,
                result_code,
                result_desc,
                amount,
                mpesa_receipt_number,
                transaction_date,
                phone_number,
                account_reference,
                status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (merchant_request_id, checkout_request_id) 
            DO UPDATE SET 
                result_code = EXCLUDED.result_code,
                result_desc = EXCLUDED.result_desc,
                amount = COALESCE(NULLIF(EXCLUDED.amount, 0), transactions.amount),
                mpesa_receipt_number = COALESCE(EXCLUDED.mpesa_receipt_number, transactions.mpesa_receipt_number),
                transaction_date = COALESCE(EXCLUDED.transaction_date, transactions.transaction_date),
                status = EXCLUDED.status,
                updated_at = CURRENT_TIMESTAMP
            RETURNING id, status
        `;
        
        const values = [
            merchantRequestId,
            checkoutRequestId,
            resultCode,
            resultDesc,
            amount,
            mpesaReceiptNumber,
            transactionDate,
            phoneNumber,
            accountReference,
            isSuccess ? 'completed' : 'failed'
        ];
        
        const result = await client.query(query, values);
        
        // If payment was successful, you can trigger additional actions here
        if (isSuccess) {
            console.log(`✅ Payment successful: ${mpesaReceiptNumber} for KES ${amount}`);
            // TODO: Add your business logic here (e.g., activate subscription)
        } else {
            console.warn(`⚠️ Payment failed: ${resultDesc} (Code: ${resultCode})`);
        }
        
        await client.query('COMMIT');
        
        // Always respond with success to M-Pesa
        res.status(200).json({
            ResultCode: '0',
            ResultDesc: 'Callback processed successfully'
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error processing M-Pesa callback:', error);
        
        // Still respond with success to M-Pesa to prevent retries
        res.status(200).json({
            ResultCode: '0',
            ResultDesc: 'Callback received with errors (logged)'
        });
    } finally {
        client.release();
    }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The transaction ID
 *         merchant_request_id:
 *           type: string
 *           description: The merchant request ID from M-Pesa
 *         checkout_request_id:
 *           type: string
 *           description: The checkout request ID from M-Pesa
 *         result_code:
 *           type: integer
 *           description: The M-Pesa result code
 *         result_desc:
 *           type: string
 *           description: The result description from M-Pesa
 *         amount:
 *           type: number
 *           format: float
 *           description: The transaction amount
 *         mpesa_receipt_number:
 *           type: string
 *           description: The M-Pesa receipt number (for successful transactions)
 *         transaction_date:
 *           type: string
 *           format: date-time
 *           description: The transaction timestamp from M-Pesa
 *         phone_number:
 *           type: string
 *           description: The customer's phone number
 *         account_reference:
 *           type: string
 *           description: The account reference for the transaction
 *         status:
 *           type: string
 *           enum: [pending, completed, failed]
 *           description: The transaction status
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: When the transaction was created
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: When the transaction was last updated
 */

export default router;
