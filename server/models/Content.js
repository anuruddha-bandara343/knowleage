const mongoose = require('mongoose');

// Version subdocument schema (Composition Pattern)
const versionSchema = new mongoose.Schema({
    versionNum: {
        type: Number,
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

// Metadata subdocument schema
const metadataSchema = new mongoose.Schema({
    domain: {
        type: String,
        trim: true
    },
    region: {
        type: String,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }]
}, { _id: false });

const contentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        unique: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    metadata: metadataSchema,
    versions: [versionSchema],
    uploader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Index for faster title lookups (duplicate detection)
contentSchema.index({ title: 1 });
// Index for status-based queries
contentSchema.index({ status: 1 });

module.exports = mongoose.model('Content', contentSchema);
