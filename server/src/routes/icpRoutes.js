import express from 'express';
import { getIcp, updateIcp, resetWeights } from '../controllers/icpController.js';

const router = express.Router();

router.get('/', getIcp);
router.put('/', updateIcp);
router.post('/reset-weights', resetWeights);

export default router;

