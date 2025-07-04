import { Router } from "express";
import { getAllMaps } from "../controllers/mapController";

const mapRouter = Router();

// Route pour récupérer toues les maps
mapRouter.get('/', getAllMaps);

export default mapRouter;