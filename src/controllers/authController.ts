import { Request, Response } from 'express';
import { prisma } from "../lib/prisma";  
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import { generateToken } from '../lib/generateToken';


// Login an existing user
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  
  
    if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
    }
  
  try {
      console.log("Login attempt with email:", email);
      const user = await prisma.user.findUnique({ where: { email } });
  
      if (!user) {
          res.status(401).json({ message: "Invalid email or password" });
          return;
    }
    
      console.log("User found:", user.id);
  
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
          res.status(401).json({ message: "Invalid email or password" });
          return;
      }
  
    const token = generateToken(user.id, user.email);
    
      console.log("Token generated for user:", user.id);
        
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
