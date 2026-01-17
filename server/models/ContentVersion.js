const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const contentVersionSchema = new mongoose.Schema({
    versionId: {
        type: String,
        default: () => uuidv4(),
        unique: true
    },
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true
    },
    versionNumber: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    fileUrl: {
        type: String
    },
    changelog: {
        type: String,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isLatest: {
        type: Boolean,
        default: true
    },
    size: {
        type: Number,
        default: 0
    },
    checksum: {
        type: String
    }
}, {
    timestamps: true
});

contentVersionSchema.index({ documentId: 1, versionNumber: -1 });
contentVersionSchema.index({ documentId: 1, isLatest: 1 });

module.exports = mongoose.model('ContentVersion', contentVersionSchema);
