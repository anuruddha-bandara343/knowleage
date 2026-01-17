const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['DOCUMENT_PENDING', 'DOCUMENT_APPROVED', 'DOCUMENT_REJECTED', 'BADGE_EARNED', 'SYSTEM', 'DUPLICATE_WARNING', 'LIKE', 'COMMENT', 'NEW_KNOWLEDGE'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    relatedDocument: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: false
});

// Compound index for unread notifications
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Static method to notify users by role
notificationSchema.statics.notifyByRole = async function (role, notification) {
    const User = mongoose.model('User');
    const users = await User.find({ role, isActive: true }, '_id');

    const notifications = users.map(user => ({
        recipient: user._id,
        ...notification
    }));

    return await this.insertMany(notifications);
};

// Static method to notify ALL users
notificationSchema.statics.notifyAll = async function (notification) {
    const User = mongoose.model('User');
    const users = await User.find({ isActive: true }, '_id');

    const notifications = users.map(user => ({
        recipient: user._id,
        ...notification
    }));

    return await this.insertMany(notifications);
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function (userId) {
    return await this.countDocuments({ recipient: userId, isRead: false });
};

module.exports = mongoose.model('Notification', notificationSchema);
