const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const controller = require('../controllers/paymentController');

const router = express.Router();

router.get('/farmer/:farmerId', controller.getPaymentsByFarmer);
router.get('/:id',              controller.getPaymentById);
router.post('/generate', [
  body('farmerId').isInt().withMessage('Farmer ID is required'),
  body('periodStart').notEmpty().withMessage('Period start date is required'),
  body('periodEnd').notEmpty().withMessage('Period end date is required'),
], validate, controller.generatePayment);
router.delete('/:id', controller.deletePayment);

module.exports = router;
