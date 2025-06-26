import { Router } from "express";
import { login, logout } from "../controllers/authController";
import authMiddleware from "../middlewares/authMiddleware";

const authRouter = Router();

// Login route
authRouter.post('/login', login);

// Logout route
authRouter.post('/logout', authMiddleware, logout);

export default authRouter;