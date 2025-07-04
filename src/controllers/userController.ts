import { prisma } from "../lib/prisma";
import { Request, Response } from 'express';
import { generateToken } from "../lib/generateToken";
import bcrypt from 'bcryptjs';



// This function retrieves user information based on the authenticated user's ID.
export const getUserInfo = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
        res.status(400).json({ message: "User ID is required" });
        return;
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                createdAt: true,
                drafts: {
                  select: {
                  uuid: true,
                  createdAt: true,
                  }
                }
            }
        });

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user info:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Register a new user
export const register = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
      res.status(400).json({ message: "Username, Email and Password are required." });
      return;
  }

    const regex = /^(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/g

    if (!password.match(regex)) {
      return;
    }

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }]
      },
    });

    if (existingUser) {
        res.status(409).json({ message: "Username or email already exists." });
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      }
    });

    res.status(201).json({ message: "User created", user: newUser });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// This function updates user information based on the authenticated user's ID.
export const updateUserInfo = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { username, email, password } = req.body;
  
    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }
  
    const dataToUpdate: { username?: string; email?: string; password?: string } = {};
  
    if (username) dataToUpdate.username = username;
    if (email) dataToUpdate.email = email;
    if (password) dataToUpdate.password = await bcrypt.hash(password, 10);
  
    if (Object.keys(dataToUpdate).length === 0) {
      res.status(400).json({ message: "No data provided to update" });
      return;
    }
  
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true,
        }
      });
    
        const newToken = generateToken(updatedUser.id, updatedUser.email);
            
        res.cookie("session", newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 2 * 60 * 60 * 1000 
            });

      res.status(200).json({ user: updatedUser });
    } catch (error) {
      console.error("Error updating user info:", error);
      res.status(500).json({ message: "Internal server error" });
    }
};
  

// Delete a user by ID
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(400).json({ message: "User ID is required" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await prisma.user.delete({ where: { id: userId } });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}