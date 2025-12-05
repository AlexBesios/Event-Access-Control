/* global require, module */
const express = require('express');
const { verifyFace } = require('../controllers/verificationController');

const router = express.Router();

router.post('/', verifyFace);

module.exports = router;
