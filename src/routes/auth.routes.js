import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { registerSchema, loginSchema } from '../validations/auth.validation.js';

const router = Router();

router.post('/register', validate(registerSchema, 'body'), authController.register);
router.post('/login', validate(loginSchema, 'body'), authController.login);

export default router;

