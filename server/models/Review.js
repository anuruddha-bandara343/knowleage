const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true
    },
    reviewerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    decision: {
        type: String,
        enum: ['Approved', 'Rejected', 'RequestRevision', 'Pending'],
        default: 'Pending'
    },
    comments: {
        type: String,
        trim: true
    },
    rejectionReason: {
        type: String,
        trim: true
    },
    revisionNotes: {
        type: String,
        trim: true
    },
    reviewType: {
        type: String,
        enum: ['Initial', 'Revision', 'Compliance', 'Final'],
        default: 'Initial'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    reviewedAt: {
        type: Date
    },
    dueDate: {
        type: Date
    },
    timeSpentMinutes: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

reviewSchema.index({ documentId: 1, reviewerId: 1 });
reviewSchema.index({ reviewerId: 1, decision: 1 });
reviewSchema.index({ decision: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
