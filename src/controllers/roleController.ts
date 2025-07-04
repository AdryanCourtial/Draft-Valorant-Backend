import { prisma } from "../lib/prisma";  
import { Request, Response } from "express";

export const getAllRoles = async(req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany();
    res.status(200).json(roles);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
}