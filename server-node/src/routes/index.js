/* global require, module */
const express = require('express');
const memberRoutes = require('./memberRoutes');
const verificationRoutes = require('./verificationRoutes');

const router = express.Router();

router.use('/members', memberRoutes);
router.use('/verify', verificationRoutes);

module.exports = router;
