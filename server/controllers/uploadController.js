const Document = require('../models/Document');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

/**
 * Upload Controller - Implements IUpload Interface
 * Handles document upload with duplicate detection and compliance checks
 */

/**
 * POST /api/upload
 * Smart Upload with Duplicate Detection and Compliance Check
 */
exports.uploadDocument = async (req, res) => {
    try {
        const {
            title,
            description,
            fileUrl,
            uploaderId,
            domain,
            region,
        } = req.body;

        // Parse JSON strings from FormData
        let tags = req.body.tags || [];
        let metadata = req.body.metadata || [];
        let confirmDuplicate = req.body.confirmDuplicate || false;

        // Handle JSON string parsing for FormData
        if (typeof tags === 'string') {
            try {
                tags = JSON.parse(tags);
            } catch (e) {
                tags = [];
            }
        }
        if (typeof metadata === 'string') {
            try {
                metadata = JSON.parse(metadata);
            } catch (e) {
                metadata = [];
            }
        }
        if (typeof confirmDuplicate === 'string') {
            confirmDuplicate = confirmDuplicate === 'true';
        }

        // Determine the file URLs - from multiple uploaded files or provided URL
        let fileUrls = [];

        // If files were uploaded, use their paths
        if (req.files && req.files.length > 0) {
            fileUrls = req.files.map(file => `/uploads/${file.filename}`);
        } else if (fileUrl) {
            fileUrls = [fileUrl];
        }

        // Validate required fields - title and uploaderId are required, file is optional
        if (!title || !uploaderId) {
            return res.status(400).json({
                success: false,
                message: 'Title and uploaderId are required'
            });
        }

        // Get uploader info
        const uploader = await User.findById(uploaderId);
        if (!uploader) {
            return res.status(404).json({
                success: false,
                message: 'Uploader not found'
            });
        }

        // ========== STEP 1: Duplicate Detection (Simulated NLP - 80% similarity) ==========
        const similarDocs = await Document.findSimilarByTitle(title, 0.8);

        if (similarDocs.length > 0 && !confirmDuplicate) {
            // Log duplicate detection
            await AuditLog.log({
                actorId: uploaderId,
                actorName: uploader.name,
                actorRole: uploader.role,
                action: 'DUPLICATE_DETECTED',
                targetId: title,
                targetType: 'Document',
                details: `Similar document found: ${similarDocs[0].document.title} (${similarDocs[0].similarity}% match)`,
                metadata: { similarDocs: similarDocs.map(d => ({ id: d.document._id, similarity: d.similarity })) }
            });

            return res.status(409).json({
                success: false,
                code: 'DUPLICATE_WARNING',
                message: 'Possible duplicate detected. Set confirmDuplicate: true to proceed.',
                data: {
                    similarDocuments: similarDocs.map(d => ({
                        id: d.document._id,
                        title: d.document.title,
                        similarity: `${d.similarity}%`
                    }))
                }
            });
        }

        // ========== STEP 2: Compliance Check (GDPR) ==========
        const complianceResult = Document.checkCompliance(metadata, region);

        let documentStatus = 'Pending';
        let complianceNotes = null;

        if (!complianceResult.passed) {
            documentStatus = 'Rejected';
            complianceNotes = complianceResult.reason;

            // Log compliance flag
            await AuditLog.log({
                actorId: uploaderId,
                actorName: uploader.name,
                actorRole: uploader.role,
                action: 'COMPLIANCE_FLAG',
                targetId: title,
                targetType: 'Document',
                details: complianceResult.reason
            });
        }

        // ========== STEP 3: Check for existing document (versioning) ==========
        const existingDoc = await Document.findOne({
            title: { $regex: new RegExp(`^${title.trim()}$`, 'i') }
        });

        let document;
        let isNewVersion = false;

        if (existingDoc && confirmDuplicate) {
            // Add new version to existing document
            const newVersionNum = existingDoc.addVersion(finalFileUrl, uploaderId);
            await existingDoc.save();
            document = existingDoc;
            isNewVersion = true;

            await AuditLog.log({
                actorId: uploaderId,
                actorName: uploader.name,
                actorRole: uploader.role,
                action: 'VERSION_UPDATE',
                targetId: document._id.toString(),
                details: `Added version ${newVersionNum}`
            });
        } else {
            // Create new document with multiple file URLs
            // Only add version entry if files are provided
            const versionsArray = fileUrls.length > 0 ? [{
                versionNum: 1,
                fileUrl: fileUrls[0], // Primary file for versioning
                createdBy: uploaderId,
                createdAt: new Date()
            }] : [];

            document = await Document.create({
                title,
                description,
                status: documentStatus,
                isSensitive: complianceResult.isSensitive,
                complianceNotes,
                domain,
                region,
                tags,
                metadata,
                fileUrls: fileUrls, // Store all file URLs (can be empty)
                versions: versionsArray,
                uploader: uploaderId,
                isDuplicateWarning: similarDocs.length > 0
            });

            await AuditLog.log({
                actorId: uploaderId,
                actorName: uploader.name,
                actorRole: uploader.role,
                action: 'UPLOAD',
                targetId: document._id.toString(),
                details: `New document created: ${title}`
            });
        }

        // ========== STEP 4: Gamification - Award points ==========
        await User.findByIdAndUpdate(uploaderId, { $inc: { score: 10 } });

        // Check for badge awards
        const badgeResult = await User.checkAndAwardBadges(uploaderId);
        if (badgeResult?.badgesAwarded?.length > 0) {
            for (const badge of badgeResult.badgesAwarded) {
                await AuditLog.log({
                    actorId: uploaderId,
                    action: 'BADGE_EARNED',
                    targetId: uploaderId,
                    targetType: 'User',
                    details: `Earned badge: ${badge}`
                });
            }
        }

        // ========== STEP 5: Notify Senior Consultants (if pending) ==========
        if (documentStatus === 'Pending') {
            await Notification.notifyByRole('SeniorConsultant', {
                type: 'DOCUMENT_PENDING',
                title: 'New Document Pending Review',
                message: `"${title}" uploaded by ${uploader.name} requires review.`,
                relatedDocument: document._id
            });

            // Also notify Knowledge Champions
            await Notification.notifyByRole('KnowledgeChampion', {
                type: 'DOCUMENT_PENDING',
                title: 'New Document Pending Review',
                message: `"${title}" uploaded by ${uploader.name} requires review.`,
                relatedDocument: document._id
            });
        }

        // ========== Response ==========
        res.status(201).json({
            success: true,
            message: isNewVersion
                ? 'New version added successfully'
                : complianceResult.passed
                    ? 'Document uploaded successfully'
                    : 'Document flagged for compliance review',
            data: {
                document: {
                    id: document._id,
                    documentId: document.documentId,
                    title: document.title,
                    status: document.status,
                    isSensitive: document.isSensitive,
                    complianceNotes: document.complianceNotes,
                    versionCount: document.versions.length
                },
                isNewVersion,
                complianceCheck: complianceResult,
                pointsEarned: 10,
                badgesEarned: badgeResult?.badgesAwarded || []
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading document',
            error: error.message
        });
    }
};

/**
 * GET /api/documents/:id
 * Get single document by ID
 */
exports.getDocument = async (req, res) => {
    try {
        const { id } = req.params;

        const document = await Document.findById(id)
            .populate('uploader', 'name email role')
            .populate('reviewedBy', 'name email role')
            .populate('comments.user', 'name');

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        res.status(200).json({
            success: true,
            data: document
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching document',
            error: error.message
        });
    }
};

/**
 * GET /api/documents
 * Get all documents (role-based visibility)
 */
exports.getAllDocuments = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        let query = {};

        // Role-based visibility
        if (user.role === 'Consultant') {
            // Consultants can see: approved documents OR their own uploads (any status)
            query = {
                $or: [
                    { status: 'Approved' },
                    { uploader: user._id }
                ]
            };
        }
        // SeniorConsultant, KnowledgeChampion, Admin can see all

        const documents = await Document.find(query)
            .populate('uploader', 'name email role')
            .populate('comments.user', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: documents.length,
            userRole: user.role,
            data: documents
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching documents',
            error: error.message
        });
    }
};
