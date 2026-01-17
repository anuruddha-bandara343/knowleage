const Content = require('../models/Content');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { detectDuplicate, getExpertRecommendation } = require('../helpers/simulatedAI');

/**
 * Create Audit Log Entry
 * @param {string} action - Action type
 * @param {string} userId - User performing action
 * @param {string} targetId - Target content ID
 * @param {string} details - Additional details
 */
const createAuditLog = async (action, userId, targetId, details = '') => {
    await AuditLog.create({
        action,
        performedBy: userId,
        targetId: targetId.toString(),
        details
    });
};

/**
 * Smart Upload - Versioning Logic
 * POST /api/contents/upload
 * 
 * Logic:
 * 1. Check if document with same title exists
 * 2. If NO: Create new Content with versionNum: 1
 * 3. If YES: Push new version to existing document
 * 4. Increment uploader's score by 10 points
 */
exports.uploadContent = async (req, res) => {
    try {
        const { title, metadata, fileUrl, uploaderId } = req.body;

        // Validate required fields
        if (!title || !fileUrl || !uploaderId) {
            return res.status(400).json({
                success: false,
                message: 'Title, fileUrl, and uploaderId are required'
            });
        }

        // Check for duplicate (Simulated AI - exact title match)
        const existingContent = await detectDuplicate(title, Content);

        let content;
        let isNewVersion = false;

        if (existingContent) {
            // Document exists - Add new version
            const newVersionNum = existingContent.versions.length + 1;

            existingContent.versions.push({
                versionNum: newVersionNum,
                fileUrl,
                createdAt: new Date()
            });

            await existingContent.save();
            content = existingContent;
            isNewVersion = true;

            // Audit Log - Version Update
            await createAuditLog('VERSION_UPDATE', uploaderId, content._id,
                `Added version ${newVersionNum}`);

        } else {
            // New document - Create with version 1
            content = await Content.create({
                title,
                metadata: metadata || {},
                versions: [{
                    versionNum: 1,
                    fileUrl,
                    createdAt: new Date()
                }],
                uploader: uploaderId
            });

            // Audit Log - New Upload
            await createAuditLog('UPLOAD', uploaderId, content._id, 'New content created');
        }

        // Gamification - Increment uploader's score by 10
        await User.findByIdAndUpdate(uploaderId, { $inc: { score: 10 } });

        // Get expert recommendations if applicable
        const tags = metadata?.tags || [];
        const expertRecommendations = getExpertRecommendation(tags);

        res.status(201).json({
            success: true,
            message: isNewVersion ? 'New version added successfully' : 'Content created successfully',
            data: {
                content,
                isNewVersion,
                currentVersion: content.versions.length,
                expertRecommendations
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading content',
            error: error.message
        });
    }
};

/**
 * Get All Contents - Role-Based Visibility
 * GET /api/contents
 * 
 * Logic:
 * - Admin: Return ALL documents
 * - Consultant: Return ONLY Approved documents
 */
exports.getContents = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required'
            });
        }

        // Get user to check role
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
            query.status = 'Approved';
        }
        // Admin gets all documents (no filter)

        const contents = await Content.find(query)
            .populate('uploader', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: contents.length,
            userRole: user.role,
            data: contents
        });

    } catch (error) {
        console.error('Get contents error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching contents',
            error: error.message
        });
    }
};

/**
 * Approve Content
 * PATCH /api/contents/:id/approve
 */
exports.approveContent = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        const content = await Content.findByIdAndUpdate(
            id,
            { status: 'Approved' },
            { new: true }
        );

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }

        // Audit Log
        await createAuditLog('APPROVE', userId, id, 'Content approved');

        res.status(200).json({
            success: true,
            message: 'Content approved successfully',
            data: content
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error approving content',
            error: error.message
        });
    }
};

/**
 * Reject Content
 * PATCH /api/contents/:id/reject
 */
exports.rejectContent = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        const content = await Content.findByIdAndUpdate(
            id,
            { status: 'Rejected' },
            { new: true }
        );

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }

        // Audit Log
        await createAuditLog('REJECT', userId, id, 'Content rejected');

        res.status(200).json({
            success: true,
            message: 'Content rejected',
            data: content
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error rejecting content',
            error: error.message
        });
    }
};

/**
 * Get Single Content by ID
 * GET /api/contents/:id
 */
exports.getContentById = async (req, res) => {
    try {
        const { id } = req.params;

        const content = await Content.findById(id)
            .populate('uploader', 'name email');

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }

        res.status(200).json({
            success: true,
            data: content
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching content',
            error: error.message
        });
    }
};
