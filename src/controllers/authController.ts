import { Request, Response } from 'express';
import { prisma } from "../lib/prisma";  
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import { generateToken } from '../lib/generateToken';


// Register a new user
export const register = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
      res.status(400).json({ message: "Username, Email and Password are required." });
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

// Login an existing user
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  
  
    if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
    }
  
    try {
      const user = await prisma.user.findUnique({ where: { email } });
  
      if (!user) {
          res.status(401).json({ message: "Invalid email or password" });
          return;
      }
  
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
          res.status(401).json({ message: "Invalid email or password" });
          return;
      }
  
      const token = generateToken(user.id, user.email);
        
      res.cookie("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", 
        sameSite: "strict",
        maxAge: 2 * 60 * 60 * 1000
      });
  
      const { password: _, ...userData } = user;
  
      res.status(200).json({
          message: "Login successful",
            token,
        user: userData
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
};
  

// Logout user and clear session cookie
export const logout = (req: Request, res: Response): void => {
    res.clearCookie('session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  
    res.status(200).json({ message: 'Déconnexion réussie, token supprimé' });
  };
