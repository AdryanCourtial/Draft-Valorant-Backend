import { Router } from "express";
import { getAllRoles } from "../controllers/roleController";

const roleRouter = Router();

// Route pour récupérer tous les rôles
roleRouter.get('/', getAllRoles);


export default roleRouter;