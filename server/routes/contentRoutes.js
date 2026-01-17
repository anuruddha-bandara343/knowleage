const express = require('express');
const router = express.Router();
const {
    uploadContent,
    getContents,
    getContentById,
    approveContent,
    rejectContent
} = require('../controllers/contentController');

// @route   POST /api/contents/upload
// @desc    Upload content (smart versioning)
// @access  Public (would be protected in production)
router.post('/upload', uploadContent);

// @route   GET /api/contents
// @desc    Get all contents (role-based visibility)
// @access  Public
router.get('/', getContents);

// @route   GET /api/contents/:id
// @desc    Get single content by ID
// @access  Public
router.get('/:id', getContentById);

// @route   PATCH /api/contents/:id/approve
// @desc    Approve content (Admin only)
// @access  Admin
router.patch('/:id/approve', approveContent);

// @route   PATCH /api/contents/:id/reject
// @desc    Reject content (Admin only)
// @access  Admin
router.patch('/:id/reject', rejectContent);

module.exports = router;
