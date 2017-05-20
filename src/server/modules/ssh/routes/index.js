import express from 'express';
import controllers from '../controllers/index';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/status')
  .get(controllers.getStatus);

router.route('/mls')
  .get(controllers.configureMLS);

export default router;
