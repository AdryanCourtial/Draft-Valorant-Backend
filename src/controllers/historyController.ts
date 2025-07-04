import { Room } from "drafter-valorant-types";
import { prisma } from "../lib/prisma";  
import { Request, Response } from "express";

export const getHistoryByUuid = async (req: Request, res: Response): Promise<void> => {
  const { uuid } = req.params;

  if (!uuid) {
    res.status(400).json({ message: "UUID is required" });
    return;
  }

  try {
    const history = await prisma.draftHistory.findUnique({
      where: { uuid },
    });
    

    
    if (!history) {
      res.status(404).json({ message: "History not found" });
      return;
    }
    
    res.status(200).json(history);

  } catch (err) {
    console.error("Erreur getHistoryByUuid:", err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
