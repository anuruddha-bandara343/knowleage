/**
 * Compliance Service - Regulatory Compliance Checking
 */

const Document = require('../models/Document');
const { checkGDPRCompliance } = require('../utils/metadataValidator');

class ComplianceService {
    /**
     * Check document compliance
     */
    checkDocumentCompliance(document) {
        const issues = [];

        // GDPR check
        const gdprResult = checkGDPRCompliance(document.metadata, document.region);
        if (!gdprResult.compliant) {
            issues.push({
                type: 'GDPR',
                severity: 'high',
                message: gdprResult.reason,
                requiresReview: true
            });
        }

        // Check for sensitive content flags
        if (document.isSensitive) {
            issues.push({
                type: 'Sensitivity',
                severity: 'medium',
                message: 'Document marked as sensitive',
                requiresReview: true
            });
        }

        // Check metadata completeness
        const requiredMetadata = ['domain', 'region'];
        const presentKeys = document.metadata?.map(m => m.key.toLowerCase()) || [];
        const missingMetadata = requiredMetadata.filter(k => !presentKeys.includes(k));

        if (missingMetadata.length > 0) {
            issues.push({
                type: 'Metadata',
                severity: 'low',
                message: `Missing recommended metadata: ${missingMetadata.join(', ')}`,
                requiresReview: false
            });
        }

        return {
            isCompliant: issues.filter(i => i.severity === 'high').length === 0,
            issues,
            requiresManualReview: issues.some(i => i.requiresReview)
        };
    }

    /**
     * Get flagged documents
     */
    async getFlaggedDocuments() {
        return Document.find({ complianceFlag: true })
            .populate('uploader', 'name email role')
            .sort({ createdAt: -1 });
    }

    /**
     * Flag document for compliance review
     */
    async flagDocument(docId, reason, userId) {
        const document = await Document.findById(docId);
        if (!document) {
            throw new Error('Document not found');
        }

        document.complianceFlag = true;
        document.flagReason = reason;
        await document.save();

        return document;
    }

    /**
     * Unflag document
     */
    async unflagDocument(docId, userId) {
        const document = await Document.findById(docId);
        if (!document) {
            throw new Error('Document not found');
        }

        document.complianceFlag = false;
        document.flagReason = '';
        await document.save();

        return document;
    }

    /**
     * Get compliance report
     */
    async getComplianceReport() {
        const [totalDocs, flaggedDocs, sensitiveDocs, pendingReview] = await Promise.all([
            Document.countDocuments(),
            Document.countDocuments({ complianceFlag: true }),
            Document.countDocuments({ isSensitive: true }),
            Document.countDocuments({ status: 'Pending' })
        ]);

        // Get flagged by reason
        const flaggedByReason = await Document.aggregate([
            { $match: { complianceFlag: true } },
            { $group: { _id: '$flagReason', count: { $sum: 1 } } }
        ]);

        return {
            totalDocuments: totalDocs,
            flaggedDocuments: flaggedDocs,
            sensitiveDocuments: sensitiveDocs,
            pendingReview,
            complianceRate: totalDocs > 0
                ? Math.round(((totalDocs - flaggedDocs) / totalDocs) * 100)
                : 100,
            flaggedByReason
        };
    }

    /**
     * Batch compliance check
     */
    async batchComplianceCheck() {
        const documents = await Document.find({ status: { $in: ['Pending', 'Approved'] } });
        const results = [];

        for (const doc of documents) {
            const compliance = this.checkDocumentCompliance(doc);
            if (!compliance.isCompliant && !doc.complianceFlag) {
                doc.complianceFlag = true;
                doc.flagReason = compliance.issues[0]?.message || 'Compliance issue detected';
                await doc.save();
                results.push({ docId: doc._id, title: doc.title, issues: compliance.issues });
            }
        }

        return {
            checked: documents.length,
            flagged: results.length,
            details: results
        };
    }
}

module.exports = new ComplianceService();
