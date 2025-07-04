import { Router } from 'express';
import { get } from 'http';
import { getAllAgents, getAgentById } from '../controllers/agentController';
const agentRouter = Router();

// Route pour récupérer tous les agents
agentRouter.get('/', getAllAgents);

// Route pour récupérer un agent par son id
agentRouter.get('/:id', getAgentById);



export default agentRouter;