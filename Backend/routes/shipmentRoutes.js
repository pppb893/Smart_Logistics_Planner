import express from 'express';
import {
  getShipments,
  createShipment,
  toggleShipmentVisibility,
  deleteShipment
} from '../controllers/shipmentController.js';
import { protectRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protectRoute, getShipments);
router.post('/', protectRoute, createShipment);
router.patch('/:id/toggle', protectRoute, toggleShipmentVisibility);
router.delete('/:id', protectRoute, deleteShipment);

export default router;
