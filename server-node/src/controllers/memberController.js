/* global require, module */
const database = require('../services/database');
const pythonService = require('../services/pythonService');
const { searchMembers } = require('../services/searchService');
const FormData = require('form-data');

async function registerMember(req, res) {
    try {
        const { first_name, last_name, email, phone, camera_image } = req.body;
        const image = req.file;

        if (!first_name || !last_name || !email) {
            return res.status(400).json({ detail: 'Missing required fields' });
        }

        const existing = database.getMemberByEmail(email);
        if (existing) {
            return res.status(400).json({ detail: 'Email already registered' });
        }

        const formData = new FormData();
        formData.append('first_name', first_name.trim());
        formData.append('last_name', last_name.trim());
        formData.append('email', email);
        formData.append('phone', phone || '');

        if (image) {
            formData.append('image', image.buffer, image.originalname);
        } else if (camera_image) {
            formData.append('camera_image', camera_image);
        } else {
            return res.status(400).json({ detail: 'No image provided' });
        }

        await pythonService.registerFace(formData);

        res.status(201).json({
            message: 'Member registered successfully',
            data: { first_name, last_name, email, phone }
        });
    } catch (error) {
        console.error('Registration error:', error.message);
        res.status(500).json({ detail: error.message });
    }
}

async function getMembers(req, res) {
    try {
        const { search } = req.query;
        let members = database.getAllMembers();

        members = members.map(member => {
            if (member.face_image) {
                member.photo = `http://localhost:8000/api/face/image/${member.id}`;
            } else {
                member.photo = null;
            }
            delete member.face_image;
            return member;
        });

        if (search) {
            members = searchMembers(members, search);
        }

        res.json({ members });
    } catch (error) {
        console.error('Get members error:', error.message);
        res.status(500).json({ detail: 'Failed to fetch members' });
    }
}

async function deleteMember(req, res) {
    try {
        const { member_id } = req.params;
        database.deleteMember(member_id);
        res.json({ message: `Member ${member_id} deleted successfully` });
    } catch (error) {
        console.error('Delete member error:', error.message);
        res.status(500).json({ detail: 'Failed to delete member' });
    }
}

module.exports = { registerMember, getMembers, deleteMember };
