import { Router } from 'express';
import { get } from 'http';
import { getAllAgents, getAgentById } from '../controllers/agentController';
import { getHistoryByUuid } from '../controllers/historyController';
const historyRouter = Router();

historyRouter.get('/:uuid', getHistoryByUuid);

export default historyRouter;