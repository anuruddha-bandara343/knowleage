/**
 * File Upload Utility - Multer Configuration
 */

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
};

// Upload configurations
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Profile image upload (smaller limit)
const profileUpload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (imageTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for profile pictures'), false);
        }
    },
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB limit for profile images
    }
});

module.exports = {
    upload,
    profileUpload,
    storage,
    fileFilter
};
