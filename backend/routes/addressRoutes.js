const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');

router.get('/:username', addressController.getAddresses);
router.post('/', addressController.createAddress);
router.put('/:id', addressController.updateAddress);
router.patch('/:id/default', addressController.setDefaultAddress);
router.delete('/:id', addressController.deleteAddress);

module.exports = router;
