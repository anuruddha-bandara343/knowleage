const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['Discussion', 'QA', 'Announcement', 'Knowledge'],
        default: 'Discussion'
    },
    category: {
        type: String,
        trim: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    moderators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    threads: [{
        title: String,
        content: String,
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        isPinned: {
            type: Boolean,
            default: false
        },
        replies: [{
            content: String,
            author: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            createdAt: {
                type: Date,
                default: Date.now
            },
            isAnswer: {
                type: Boolean,
                default: false
            }
        }],
        views: {
            type: Number,
            default: 0
        },
        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

communitySchema.index({ name: 'text', description: 'text' });
communitySchema.index({ type: 1, isActive: 1 });

module.exports = mongoose.model('Community', communitySchema);
