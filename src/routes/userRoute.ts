import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware";
import { deleteUser, getUserInfo, updateUserInfo } from "../controllers/userController";

const userRouter = Router();

// Route to get user information
userRouter.get('/', authMiddleware, getUserInfo)

// Route to update user information
userRouter.put('/', authMiddleware, updateUserInfo); 

// Route to delete user account
userRouter.delete('/delete', authMiddleware, deleteUser);

export default userRouter;