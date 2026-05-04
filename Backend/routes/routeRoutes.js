import express from 'express';
import { getRecommendedRoute } from '../controllers/routeController.js';

const router = express.Router();

router.post('/recommend', getRecommendedRoute);

export default router;
