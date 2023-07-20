const express = require('express')

// Import books-controller
const usersRoutes = require('./../controllers/users-controller.js')

// Create router
const router = express.Router();

router.get('/secret/:id',usersRoutes.getSecretForUser);
router.put('/secret/:id',usersRoutes.putSecretForUser);
router.delete('/secret/:id',usersRoutes.deleteSecretForUser);

module.exports = router