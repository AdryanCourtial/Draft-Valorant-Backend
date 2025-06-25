import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Request, Response } from "express";


const prisma = new PrismaClient();

export const getAgent = async (req: Request, res: Response): Promise<void> => {
  try {
    const content = "Voici les agents disponibles :";
    res.status(200).send(content);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
}


