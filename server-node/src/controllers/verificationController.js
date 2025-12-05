/* global require, module */
const pythonService = require('../services/pythonService');

async function verifyFace(req, res) {
    try {
        const { camera_image } = req.body;

        if (!camera_image) {
            return res.status(400).json({ detail: 'No image provided' });
        }

        const result = await pythonService.verifyFace(camera_image);
        res.json(result);
    } catch (error) {
        console.error('Verification error:', error.message);
        res.status(500).json({ detail: error.message });
    }
}

module.exports = { verifyFace };
