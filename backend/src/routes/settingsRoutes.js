const express = require('express');
const controller = require('../controllers/settingsController');

const router = express.Router();

router.get('/',  controller.getAllSettings);
router.put('/',  controller.updateSettings);

module.exports = router;
