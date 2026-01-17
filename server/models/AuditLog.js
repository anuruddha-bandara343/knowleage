const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    actorName: {
        type: String
    },
    actorRole: {
        type: String
    },
    action: {
        type: String,
        required: [true, 'Action is required'],
        enum: [
            'UPLOAD',
            'VERSION_UPDATE',
            'APPROVE',
            'REJECT',
            'ARCHIVE',
            'DELETE',
            'LOGIN',
            'LOGOUT',
            'BADGE_EARNED',
            'COMPLIANCE_FLAG',
            'DUPLICATE_DETECTED'
        ],
        index: true
    },
    targetId: {
        type: String,
        required: true,
        index: true
    },
    targetType: {
        type: String,
        enum: ['Document', 'User', 'System'],
        default: 'Document'
    },
    details: {
        type: String
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now,
        immutable: true,
        index: true
    }
}, {
    timestamps: false
});

// Compound indexes for efficient querying
auditLogSchema.index({ actorId: 1, timestamp: -1 });
auditLogSchema.index({ targetId: 1, action: 1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

// Static method to create audit log entry
auditLogSchema.statics.log = async function (data) {
    const entry = new this({
        actorId: data.actorId,
        actorName: data.actorName,
        actorRole: data.actorRole,
        action: data.action,
        targetId: data.targetId,
        targetType: data.targetType || 'Document',
        details: data.details,
        metadata: data.metadata,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent
    });

    return await entry.save();
};

// Static method to get recent activity for a user
auditLogSchema.statics.getRecentActivity = async function (userId, limit = 10) {
    return await this.find({ actorId: userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
};

// Static method to get document history
auditLogSchema.statics.getDocumentHistory = async function (documentId) {
    return await this.find({ targetId: documentId, targetType: 'Document' })
        .sort({ timestamp: -1 })
        .populate('actorId', 'name email role')
        .lean();
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
