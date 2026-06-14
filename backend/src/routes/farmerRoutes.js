const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const controller = require('../controllers/farmerController');

const router = express.Router();

const farmerValidation = [
  body('fmsNo').notEmpty().withMessage('FMS number is required'),
  body('fmsName').isLength({ min: 2 }).withMessage('FMS name must be at least 2 characters'),
  body('name').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('address').isLength({ min: 5 }).withMessage('Address must be at least 5 characters'),
];

router.get('/',     controller.getAllFarmers);
router.get('/:id',  controller.getFarmerById);
router.post('/',    farmerValidation, validate, controller.createFarmer);
router.put('/:id',  controller.updateFarmer);
router.delete('/:id', controller.deleteFarmer);

module.exports = router;
