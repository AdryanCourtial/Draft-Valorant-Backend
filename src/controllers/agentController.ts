import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";  

export const getAllAgents = async (req: Request, res: Response): Promise<void> => {
  try {
    const agents = await prisma.agent.findMany({
      include: {
        role: true,
        abilities: true,
      },
    });
    res.status(200).send(agents);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

export const getAgentById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const agent = await prisma.agent.findUnique({
      where: { uuid: id },
      include: {
        role: true,
        abilities: true,
      },
    });
    if (!agent) {
      res.status(404).json({ message: 'Agent non trouvé' });
      return;
    }
    res.status(200).send(agent);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
}


