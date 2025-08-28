import { Router } from 'express';
import OffersController from '../controller/OffersController.js';
import { authenticateJwt } from '../middleware/authenticateJwt.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Offer:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated ID of the offer
 *         name:
 *           type: string
 *           description: The name of the offer
 *         description:
 *           type: string
 *           description: Detailed description of the offer
 *         price:
 *           type: number
 *           format: float
 *           description: Price of the offer in KES
 *         type:
 *           type: string
 *           description: Type of the offer (e.g., 'daily', 'weekly', 'monthly')
 *         category:
 *           type: string
 *           enum: [data, sms, voice]
 *           description: Category of the offer
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 * 
 *     OfferInput:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - type
 *         - category
 *       properties:
 *         name:
 *           type: string
 *           example: "1GB Data Bundle"
 *         description:
 *           type: string
 *           example: "1GB data valid for 24 hours"
 *         price:
 *           type: number
 *           format: float
 *           example: 100.00
 *         type:
 *           type: string
 *           example: "daily"
 *         category:
 *           type: string
 *           enum: [data, sms, voice]
 *           example: "data"
 *         purchase_limit:
 *           type: string
 *           enum: [ONCE/DAY, DYNAMIC]
 *           default: ONCE/DAY
 *           description: Purchase limit for the offer. ONCE/DAY means a user can purchase once per day, DYNAMIC means no limit.
 * 
 * /offers:
 *   get:
 *     summary: Get all offers
 *     description: Retrieve a list of all offers, optionally filtered by category
 *     tags: [Offers]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [data, sms, voice]
 *         description: Filter offers by category
 *     responses:
 *       200:
 *         description: A list of offers grouped by category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Offer'
 */
router.get('/', async (req, res, next) => {
    try {
        const { category } = req.query;
        const offers = await OffersController.getOffers(category);
        res.json({
            success: true,
            data: offers
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /offers/{id}:
 *   get:
 *     summary: Get a single offer by ID
 *     description: Retrieve details of a specific offer
 *     tags: [Offers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The offer ID
 *     responses:
 *       200:
 *         description: Offer details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Offer'
 *       404:
 *         description: Offer not found
 */
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const offer = await OffersController.getOfferById(id);

        if (!offer) {
            return res.status(404).json({
                success: false,
                message: 'Offer not found'
            });
        }

        res.json({
            success: true,
            data: offer
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /offers:
 *   post:
 *     summary: Create a new offer
 *     description: Create a new offer (protected route)
 *     tags: [Offers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       description: Offer object that needs to be created
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OfferInput'
 *           example:
 *             name: "1GB Data Bundle"
 *             description: "1GB data valid for 24 hours"
 *             price: 100.00
 *             type: "daily"
 *             category: "data"
 *             purchase_limit: "ONCE/DAY"
 *     responses:
 *       201:
 *         description: Offer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Offer'
 *       400:
 *         description: Invalid input
 */
router.post('/', authenticateJwt, async (req, res, next) => {
    try {
        const { name, description, price, type, category, purchase_limit } = req.body;

        if (!name || !price || !type || !category) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: name, price, type, and category are required'
            });
        }

        if (purchase_limit && !['ONCE/DAY', 'DYNAMIC'].includes(purchase_limit)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid purchase_limit. Must be either ONCE/DAY or DYNAMIC'
            });
        }

        const newOffer = await OffersController.addOffer({
name,
            description,
            price,
            type,
            category,
            purchase_limit
        });

        res.status(201).json({
            success: true,
            message: 'Offer created successfully',
            data: newOffer
        });
    } catch (error) {
        next(error);
    }
});

router.put('/:id', authenticateJwt, async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No update data provided'
            });
        }

        const updatedOffer = await OffersController.updateOffer(id, updateData);

        if (!updatedOffer) {
            return res.status(404).json({
                success: false,
                message: 'Offer not found'
            });
        }

        res.json({
            success: true,
            message: 'Offer updated successfully',
            data: updatedOffer
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /offers/{id}:
 *   delete:
 *     summary: Delete an offer by ID
 *     description: Permanently delete a specific offer (admin only)
 *     tags: [Offers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the offer to delete
 *     responses:
 *       200:
 *         description: Offer deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Offer deleted successfully"
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Offer not found
 */
router.delete('/:id', authenticateJwt, async (req, res, next) => {
    try {
        const { id } = req.params;
        const deletedOffer = await OffersController.deleteOffer(id);

        if (!deletedOffer) {
            return res.status(404).json({
                success: false,
                message: 'Offer not found'
            });
        }

        res.json({
            success: true,
            message: 'Offer deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /offers:
 *   delete:
 *     summary: Delete all offers
 *     description: Permanently delete all offers (admin only)
 *     tags: [Offers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All offers deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "All offers have been deleted"
 *                 count:
 *                   type: integer
 *                   description: Number of offers deleted
 *                   example: 5
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Admin access required
 */
router.delete('/', authenticateJwt, async (req, res, next) => {
    try {
        const count = await OffersController.deleteAllOffers();
        
        res.json({
            success: true,
            message: `Successfully deleted ${count} offers`,
            count
        });
    } catch (error) {
        next(error);
    }
});

export default router;