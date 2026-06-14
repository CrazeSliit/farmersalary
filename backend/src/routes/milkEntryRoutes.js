const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const controller = require('../controllers/milkEntryController');

const router = express.Router();

const entryValidation = [
  body('farmerId').isInt().withMessage('Valid farmer ID is required'),
  body('date').notEmpty().withMessage('Date is required'),
  body('receiptNo').notEmpty().withMessage('Receipt number is required'),
  body('litresKg').isFloat({ gt: 0 }).withMessage('Litres must be greater than 0'),
  body('fat').isFloat({ gt: 0 }).withMessage('FAT % is required'),
  body('snf').isFloat({ gt: 0 }).withMessage('SNF % is required'),
  body('rate').isFloat({ gt: 0 }).withMessage('Rate is required'),
  body('rupees').isFloat({ gt: 0 }).withMessage('Amount is required'),
];

router.get('/farmer/:farmerId', controller.getEntriesByFarmer);
router.post('/',    entryValidation, validate, controller.createEntry);
router.put('/:id',  controller.updateEntry);
router.delete('/:id', controller.deleteEntry);

module.exports = router;
