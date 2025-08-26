import { Router } from 'express';
import Users from '../controller/Users.js';
import { authenticateJwt } from '../middleware/authenticateJwt.js';

const router = Router();
const usersController = new Users();

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
