import { Router } from 'express';
import OffersController from '../controller/OffersController.js';
import { authenticateJwt } from '../middleware/authenticateJwt.js';

const router = Router();

/**
 * @swagger
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
 *         description: A list of offers
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
 *                     $ref: '#/components/schemas/Offer'
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
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OfferInput'
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
        const { name, description, price, type, category } = req.body;

        if (!name || !price || !type || !category) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: name, price, type, and category are required'
            });
        }

        const newOffer = await OffersController.addOffer({
            name,
            description,
            price,
            type,
            category
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

export default router;