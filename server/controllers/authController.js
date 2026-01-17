const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

/**
 * Auth Controller - Implements IAuth Interface
 * Handles user authentication and management
 */

/**
 * POST /api/auth/register
 * Register new user
 */
exports.register = async (req, res) => {
    try {
        const { name, email, password, role, department } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required'
            });
        }

        if (password.length < 4) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 4 characters'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Validate role
        const validRoles = ['NewHire', 'Consultant', 'SeniorConsultant', 'ProjectManager', 'KnowledgeChampion', 'KnowledgeGovernanceCouncil', 'ITInfrastructure', 'Admin'];
        const userRole = validRoles.includes(role) ? role : 'Consultant';

        const user = await User.create({
            name,
            email,
            password,
            role: userRole,
            department: department || ''
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                id: user._id,
                userId: user.userId,
                name: user.name,
                email: user.email,
                role: user.role,
                score: user.score,
                badges: user.badges
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error.message
        });
    }
};

/**
 * POST /api/auth/login
 * Login user (mock implementation)
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const user = await User.findOne({ email, isActive: true });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found or inactive'
            });
        }

        // Verify password (simple comparison - in production use bcrypt)
        if (user.password !== password) {
            return res.status(401).json({
                success: false,
                message: 'Invalid password'
            });
        }

        // Log login action
        await AuditLog.log({
            actorId: user._id,
            actorName: user.name,
            actorRole: user.role,
            action: 'LOGIN',
            targetId: user._id.toString(),
            targetType: 'User',
            details: 'User logged in'
        });

        // Get unread notifications count
        const unreadCount = await Notification.getUnreadCount(user._id);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token: `dkn-token-${user._id}-${Date.now()}`,
                user: {
                    id: user._id,
                    userId: user.userId,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    score: user.score,
                    badges: user.badges,
                    department: user.department
                },
                unreadNotifications: unreadCount
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error during login',
            error: error.message
        });
    }
};

/**
 * GET /api/auth/leaderboard
 * Get top users by score
 */
exports.getLeaderboard = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const users = await User.find({ isActive: true })
            .select('name email score role badges department')
            .sort({ score: -1 })
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            data: users.map((user, index) => ({
                rank: index + 1,
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                score: user.score,
                badgeCount: user.badges?.length || 0,
                badges: user.badges,
                department: user.department
            }))
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching leaderboard',
            error: error.message
        });
    }
};

/**
 * GET /api/auth/me/:userId
 * Get current user profile
 */
exports.getCurrentUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const unreadCount = await Notification.getUnreadCount(user._id);

        res.status(200).json({
            success: true,
            data: {
                ...user.toObject(),
                unreadNotifications: unreadCount
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
};

/**
 * GET /api/auth/notifications/:userId
 * Get user notifications
 */
exports.getNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const { unreadOnly = false } = req.query;

        let query = { recipient: userId };
        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('relatedDocument', 'title status');

        res.status(200).json({
            success: true,
            count: notifications.length,
            data: notifications
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching notifications',
            error: error.message
        });
    }
};

/**
 * PUT /api/auth/notifications/:notificationId/read
 * Mark notification as read
 */
exports.markNotificationRead = async (req, res) => {
    try {
        const { notificationId } = req.params;

        await Notification.findByIdAndUpdate(notificationId, { isRead: true });

        res.status(200).json({
            success: true,
            message: 'Notification marked as read'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating notification',
            error: error.message
        });
    }
};

/**
 * POST /api/auth/profile-image
 * Upload user profile image
 */
exports.uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const imageUrl = `/uploads/${req.file.filename}`;

        const user = await User.findByIdAndUpdate(
            userId,
            { profileImage: imageUrl },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile image updated successfully',
            data: {
                imageUrl
            }
        });

    } catch (error) {
        console.error('Profile upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading profile image',
            error: error.message
        });
    }
};

/**
 * GET /api/auth/users
 * Get all users (Admin/IT only)
 */
exports.getAllUsers = async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};

        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const users = await User.find(query).select('-password').sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

/**
 * PUT /api/auth/users/:id/role
 * Update user role (Admin/IT only)
 */
exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const validRoles = ['NewHire', 'Consultant', 'SeniorConsultant', 'ProjectManager', 'KnowledgeChampion', 'KnowledgeGovernanceCouncil', 'ITInfrastructure', 'Admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role'
            });
        }

        const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Audit Log
        // Note: In real app, we should pass actorId in req.user from middleware
        // For now we assume the caller is authorized

        res.status(200).json({
            success: true,
            message: 'User role updated successfully',
            data: user
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating user role',
            error: error.message
        });
    }
};

/**
 * GET /api/auth/system/stats
 * Get system health stats with database info
 */
exports.getSystemStats = async (req, res) => {
    try {
        const os = require('os');
        const Document = require('../models/Document');

        // Get database stats
        const [userCount, documentCount, pendingCount, approvedCount] = await Promise.all([
            User.countDocuments(),
            Document.countDocuments(),
            Document.countDocuments({ status: 'Pending' }),
            Document.countDocuments({ status: 'Approved' })
        ]);

        // Role distribution
        const roleStats = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        const stats = {
            uptime: process.uptime(),
            timestamp: Date.now(),
            memory: {
                total: os.totalmem(),
                free: os.freemem(),
                used: os.totalmem() - os.freemem(),
                usagePercent: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100),
                heapUsed: process.memoryUsage().heapUsed
            },
            cpu: os.cpus().length,
            platform: os.platform(),
            nodeVersion: process.version,
            activeUsers: await User.countDocuments({ isActive: true }),
            database: {
                totalUsers: userCount,
                totalDocuments: documentCount,
                pendingDocuments: pendingCount,
                approvedDocuments: approvedCount,
                roleDistribution: roleStats
            }
        };

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching system stats',
            error: error.message
        });
    }
};

/**
 * GET /api/auth/system/reports
 * Get aggregated system usage reports
 */
exports.getSystemReports = async (req, res) => {
    try {
        // Aggregate daily activity last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const activityStats = await AuditLog.aggregate([
            { $match: { timestamp: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                    count: { $sum: 1 },
                    actions: { $push: "$action" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Aggregate actions distribution
        const actionDistribution = await AuditLog.aggregate([
            { $group: { _id: "$action", count: { $sum: 1 } } }
        ]);

        // Get total for percentage calculation
        const totalActions = actionDistribution.reduce((sum, a) => sum + a.count, 0);
        const actionWithPercent = actionDistribution.map(a => ({
            ...a,
            percent: totalActions > 0 ? Math.round((a.count / totalActions) * 100) : 0
        }));

        res.status(200).json({
            success: true,
            data: {
                dailyActivity: activityStats,
                actionDistribution: actionWithPercent,
                totalActions
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching system reports',
            error: error.message
        });
    }
};

/**
 * DELETE /api/auth/users/:id
 * Delete a user (Admin/IT only)
 */
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
};

/**
 * PUT /api/auth/users/:id/status
 * Toggle user active status (enable/disable)
 */
exports.toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const user = await User.findByIdAndUpdate(
            id,
            { isActive },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            message: `User ${isActive ? 'enabled' : 'disabled'} successfully`,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating user status',
            error: error.message
        });
    }
};

/**
 * PUT /api/auth/users/:id/reset-password
 * Reset user password (Admin/IT only)
 */
exports.resetUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 4) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 4 characters'
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { password: newPassword },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error resetting password',
            error: error.message
        });
    }
};

