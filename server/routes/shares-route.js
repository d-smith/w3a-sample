const express = require('express')

// Import books-controller
const sharesRoutes = require('./../controllers/shares-controller.js')

// Create router
const router = express.Router();

router.get('/share/:id',sharesRoutes.getShareForUser);
router.put('/share/:id',sharesRoutes.putShareForUser);
router.delete('/share/:id',sharesRoutes.deleteShareForUser);

module.exports = router