import express from 'express';  
import { celebrate, Joi } from 'celebrate'

import PointsController from './controllers/PointsController';
import ItemsController from './controllers/ItemsController';

const routes = express.Router();

const pointsController = new PointsController();
const itemsController = new ItemsController();

routes.get('/items', itemsController.getAll);

routes.get('/points/:id', pointsController.get);
routes.get('/points', pointsController.getAll);
routes.post(
    '/points',
    //upload.single('image'),
    celebrate({
      body: Joi.object().keys({
        name: Joi.string().required(),
        email: Joi.string().required().email(),
        phone: Joi.number().required(),
        lat: Joi.number().required(),
        lon: Joi.number().required(),
        city: Joi.string().required(),
        uf: Joi.string().required().max(2),
        items: Joi.string().required()
      })
    }, {
      abortEarly: false
    }),
    pointsController.create);

export default routes;