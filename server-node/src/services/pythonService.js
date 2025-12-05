/* global require, process, module */
const axios = require('axios');

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

class PythonService {
    async registerFace(formData) {
        try {
            const response = await axios.post(`${PYTHON_API_URL}/api/face/register`, formData, {
                headers: formData.getHeaders ? formData.getHeaders() : { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.detail || 'Failed to register face');
        }
    }

    async verifyFace(imageData) {
        try {
            const response = await axios.post(`${PYTHON_API_URL}/api/face/verify`, {
                camera_image: imageData
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.detail || 'Failed to verify face');
        }
    }
}

module.exports = new PythonService();
