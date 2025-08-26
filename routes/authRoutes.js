import { Router } from 'express';
import Users from '../controller/Users.js';
import { authenticateJwt } from '../middleware/authenticateJwt.js';

const router = Router();
const usersController = new Users();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated ID of the user
 *         name:
 *           type: string
 *           description: The user's name
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email address
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           default: user
 *           description: The user's role
 *         description:
 *           type: string
 *           description: Additional information about the user
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: When the user was created
 * 
 *     RegisterInput:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 50
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *         password:
 *           type: string
 *           minLength: 6
 *           format: password
 *           example: "password123"
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           default: user
 *           example: "user"
 *         description:
 *           type: string
 *           example: "Regular user account"
 * 
 *     LoginInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *         password:
 *           type: string
 *           format: password
 *           example: "password123"
 * 
 *     AuthResponse:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/User'
 *         token:
 *           type: string
 *           description: JWT token for authentication
 * 
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid input
 *       409:
 *         description: User already exists
 * 
 * /auth/login:
 *   post:
 *     summary: Authenticate a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Invalid credentials
 */

// Auth routes
router.post('/register', handleAsync(usersController.register.bind(usersController)));
router.post('/login', handleAsync(usersController.login.bind(usersController)));
router.get('/users', authenticateJwt, handleAsync(usersController.getUsers.bind(usersController)));

// Error handling wrapper
function handleAsync(handler) {
    return async (req, res, next) => {
        try {
            const result = await handler(req, res, next);
            if (!res.headersSent) {
                res.json({
                    success: true,
                    data: result
                });
            }
        } catch (error) {
            next(error);
        }
    };
}

export default router;
