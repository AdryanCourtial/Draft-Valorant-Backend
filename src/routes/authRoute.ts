import { Router } from "express";
import { login, logout, register } from "../controllers/authController";
import authMiddleware from "../middlewares/authMiddleware";

const authRouter = Router();

// Registration route
authRouter.post('/register', register);

// Login route
authRouter.post('/login', login);

// Logout route
authRouter.post('/logout', authMiddleware, logout);

export default authRouter;