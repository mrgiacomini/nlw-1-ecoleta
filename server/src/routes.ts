import express from 'express';  
import { celebrate, Joi } from 'celebrate'
import multer from 'multer';
import multerConfig from './config/multer';

import PointsController from './controllers/PointsController';
import ItemsController from './controllers/ItemsController';

const routes = express.Router();
const upload = multer(multerConfig);

const pointsController = new PointsController();
const itemsController = new ItemsController();

routes.get('/items', itemsController.getAll);

routes.get('/points/:id', pointsController.get);
routes.get('/points', pointsController.getAll);
routes.post(
    '/points',
    upload.single('image'),
    // celebrate({
    //     body: Joi.object().keys(
    //     {
    //       name: Joi.string(),
    //       email: Joi.string().email(),
    //       phone: Joi.number(),
    //       lat: Joi.number(),
    //       lon: Joi.number(),
    //       city: Joi.string(),
    //       uf: Joi.string(),
    //       items: Joi.string()
    //     })
    // }, {
    //   abortEarly: false
    // }),
    pointsController.create);

export default routes;