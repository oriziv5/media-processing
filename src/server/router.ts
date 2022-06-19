import * as express from 'express';
import apiRouter from './api/api.routes.js';
import homeRouter from './home/home.routes.js';

const router = express.Router();

// Enable OPTIONS request
router.use('/', homeRouter);
router.use('/api', apiRouter);

export default router;