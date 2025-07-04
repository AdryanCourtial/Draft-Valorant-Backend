import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware";
import { deleteUser, getUserInfo, register, updateUserInfo } from "../controllers/userController";

const userRouter = Router();

// Route to get user information
userRouter.get('/', authMiddleware, getUserInfo)

// Route to register a new user
userRouter.post('/', register)

// Route to update user information
userRouter.put('/', authMiddleware, updateUserInfo); 

// Route to delete user account
userRouter.delete('/', authMiddleware, deleteUser);

export default userRouter;