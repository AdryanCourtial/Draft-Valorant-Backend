import { prisma } from "../lib/prisma";  
import { Request, Response } from "express";

export const getAllMaps = async (req: Request, res: Response): Promise<void> => {
  try {
    const maps = await prisma.map.findMany();
    res.status(200).json(maps);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
}