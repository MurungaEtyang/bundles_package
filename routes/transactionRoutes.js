import { Router } from 'express';
import { authenticateJwt } from '../middleware/authenticateJwt.js';
import Transactions from '../controller/Transactions.js';

const router = Router();

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Get all transactions
 *     description: Retrieve a list of all transactions with optional filtering
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters: []
 *     responses:
 *       200:
 *         description: A list of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       500:
 *         description: Internal server error
 */
router.get('/', authenticateJwt, Transactions.getAllTransactions);

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
