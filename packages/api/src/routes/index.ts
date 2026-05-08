import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import materialRoutes from './materials';
import requestRoutes from './requests';
import collectionRoutes from './collections';
import tripRoutes from './trips';
import routePlannerRoutes from './routesPlanner';
import financialRoutes from './financial';
import analyticsRoutes from './analytics';
import scheduleRoutes from './schedule';
import activityRoutes from './activity';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/materials', materialRoutes);
router.use('/requests', requestRoutes);
router.use('/collections', collectionRoutes);
router.use('/trips', tripRoutes);
router.use('/routes', routePlannerRoutes);
router.use('/financial', financialRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/schedule', scheduleRoutes);
router.use('/activity', activityRoutes);

export default router;
