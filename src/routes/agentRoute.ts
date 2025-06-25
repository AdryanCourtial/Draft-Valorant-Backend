import { Router } from 'express';
import { get } from 'http';
import { getAgent } from '../controllers/agent/agent';

const agentRouter = Router();

agentRouter.get('/', getAgent);

export default agentRouter;