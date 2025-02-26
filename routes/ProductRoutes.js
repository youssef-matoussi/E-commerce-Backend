const express = require('express');
const ProductController = require('../controllers/ProductController');
const router = express.Router();

router.post('/uploadProduct', ProductController.uploadProduct);
router.get('/products/:gender/:category/:subcategory', ProductController.getProductsByCategory);
router.get('/products/:gender/:category/:subcategory/:reference/', ProductController.getSpecificProduct);


module.exports = router;
