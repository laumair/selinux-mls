import express from 'express';
import ssh from '../../modules/ssh/routes';

const router = express.Router(); // eslint-disable-line new-cap

router.use(ssh);

export default router;
