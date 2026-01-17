const MetadataRule = require('../models/MetadataRule');
const AuditLog = require('../models/AuditLog');
const Document = require('../models/Document');
const User = require('../models/User');

/**
 * Governance Controller
 * For Knowledge Governance Council role
 */

// Roles allowed to access governance features
const GOVERNANCE_ROLES = ['KnowledgeGovernanceCouncil', 'Admin'];

// Helper to check permissions
const checkGovernancePermission = async (userId) => {
    const user = await User.findById(userId);
    if (!user || !GOVERNANCE_ROLES.includes(user.role)) {
        return { allowed: false, user: null };
    }
    return { allowed: true, user };
};

// ==================== METADATA RULES ====================

/**
 * GET /api/governance/rules
 * Get all metadata rules
 */
exports.getAllRules = async (req, res) => {
    try {
        const { userId } = req.query;
        const { allowed } = await checkGovernancePermission(userId);
        if (!allowed) {
            return res.status(403).json({ success: false, message: 'Permission denied' });
        }

        const rules = await MetadataRule.find().sort({ order: 1 });
        res.status(200).json({ success: true, data: rules });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/governance/rules
 * Create a new metadata rule
 */
exports.createRule = async (req, res) => {
    try {
        const { userId, ...ruleData } = req.body;
        const { allowed, user } = await checkGovernancePermission(userId);
        if (!allowed) {
            return res.status(403).json({ success: false, message: 'Permission denied' });
        }

        const rule = await MetadataRule.create(ruleData);

        await AuditLog.log({
            actorId: userId,
            actorName: user.name,
            actorRole: user.role,
            action: 'UPLOAD', // Using UPLOAD as a generic "CREATE" action
            targetId: rule._id.toString(),
            targetType: 'System',
            details: `Created metadata rule: ${rule.fieldName}`
        });

        res.status(201).json({ success: true, data: rule });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * PUT /api/governance/rules/:id
 * Update a metadata rule
 */
exports.updateRule = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, ...ruleData } = req.body;
        const { allowed, user } = await checkGovernancePermission(userId);
        if (!allowed) {
            return res.status(403).json({ success: false, message: 'Permission denied' });
        }

        const rule = await MetadataRule.findByIdAndUpdate(id, ruleData, { new: true });
        if (!rule) {
            return res.status(404).json({ success: false, message: 'Rule not found' });
        }

        await AuditLog.log({
            actorId: userId,
            actorName: user.name,
            actorRole: user.role,
            action: 'VERSION_UPDATE',
            targetId: rule._id.toString(),
            targetType: 'System',
            details: `Updated metadata rule: ${rule.fieldName}`
        });

        res.status(200).json({ success: true, data: rule });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * DELETE /api/governance/rules/:id
 * Delete a metadata rule
 */
exports.deleteRule = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.query;
        const { allowed, user } = await checkGovernancePermission(userId);
        if (!allowed) {
            return res.status(403).json({ success: false, message: 'Permission denied' });
        }

        const rule = await MetadataRule.findByIdAndDelete(id);
        if (!rule) {
            return res.status(404).json({ success: false, message: 'Rule not found' });
        }

        await AuditLog.log({
            actorId: userId,
            actorName: user.name,
            actorRole: user.role,
            action: 'DELETE',
            targetId: id,
            targetType: 'System',
            details: `Deleted metadata rule: ${rule.fieldName}`
        });

        res.status(200).json({ success: true, message: 'Rule deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== AUDIT LOGS ====================

/**
 * GET /api/governance/audit
 * Get all audit logs with filters
 */
exports.getAllAuditLogs = async (req, res) => {
    try {
        const { userId, action, startDate, endDate, limit = 100 } = req.query;
        const { allowed } = await checkGovernancePermission(userId);
        if (!allowed) {
            return res.status(403).json({ success: false, message: 'Permission denied' });
        }

        let query = {};

        if (action) {
            query.action = action;
        }

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        const logs = await AuditLog.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .lean();

        res.status(200).json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== FLAGGED CONTENT ====================

/**
 * GET /api/governance/flagged
 * Get all flagged documents
 */
exports.getFlaggedDocuments = async (req, res) => {
    try {
        const { userId } = req.query;
        const { allowed } = await checkGovernancePermission(userId);
        if (!allowed) {
            return res.status(403).json({ success: false, message: 'Permission denied' });
        }

        const documents = await Document.find({ complianceFlag: true })
            .populate('uploader', 'name email role')
            .sort({ updatedAt: -1 });

        res.status(200).json({ success: true, data: documents });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * PUT /api/governance/flag/:id
 * Flag or unflag a document
 */
exports.toggleFlag = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, flagReason, flag } = req.body;
        const { allowed, user } = await checkGovernancePermission(userId);
        if (!allowed) {
            return res.status(403).json({ success: false, message: 'Permission denied' });
        }

        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        document.complianceFlag = flag;
        document.flagReason = flag ? flagReason : null;
        await document.save();

        await AuditLog.log({
            actorId: userId,
            actorName: user.name,
            actorRole: user.role,
            action: 'COMPLIANCE_FLAG',
            targetId: document._id.toString(),
            details: flag ? `Flagged: ${flagReason}` : 'Flag resolved'
        });

        res.status(200).json({ success: true, data: document });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
