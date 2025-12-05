/* global require, module */
const express = require('express');
const multer = require('multer');
const { registerMember, getMembers, deleteMember } = require('../controllers/memberController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/register', upload.single('image'), registerMember);
router.get('/', getMembers);
router.delete('/:member_id', deleteMember);

module.exports = router;
