const express = require('express');
const router = express.Router();
const { upload } = require('../utils/fileUpload');
const {
    login,
    register,
    getLeaderboard,
    getCurrentUser,
    getNotifications,
    markNotificationRead,
    uploadProfileImage,
    getAllUsers,
    updateUserRole,
    getSystemStats,
    getSystemReports,
    deleteUser,
    toggleUserStatus,
    resetUserPassword
} = require('../controllers/authController');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: User already exists or validation error
 */
router.post('/register', register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/leaderboard:
 *   get:
 *     summary: Get top users by score
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of top users to return
 *     responses:
 *       200:
 *         description: Leaderboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 leaderboard:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.get('/leaderboard', getLeaderboard);

/**
 * @swagger
 * /auth/me/{userId}:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get('/me/:userId', getCurrentUser);

/**
 * @swagger
 * /auth/notifications/{userId}:
 *   get:
 *     summary: Get user notifications
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/notifications/:userId', getNotifications);

/**
 * @swagger
 * /auth/notifications/{notificationId}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.put('/notifications/:notificationId/read', markNotificationRead);

/**
 * @swagger
 * /auth/profile-image:
 *   post:
 *     summary: Upload profile image
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 */
router.post('/profile-image', upload.single('image'), uploadProfileImage);

// ========== IT Infrastructure Routes ==========

/**
 * @swagger
 * /auth/users:
 *   get:
 *     summary: Get all users (Admin/IT only)
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of all users
 */
router.get('/users', getAllUsers);

/**
 * @swagger
 * /auth/users/{id}/role:
 *   put:
 *     summary: Update user role (Admin/IT only)
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [NewHire, Consultant, SeniorConsultant, ProjectManager, KnowledgeChampion, KnowledgeGovernanceCouncil, ITInfrastructure, Admin]
 *     responses:
 *       200:
 *         description: Role updated successfully
 */
router.put('/users/:id/role', updateUserRole);

/**
 * @swagger
 * /auth/users/{id}:
 *   delete:
 *     summary: Delete user (Admin/IT only)
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete('/users/:id', deleteUser);

/**
 * @swagger
 * /auth/users/{id}/status:
 *   put:
 *     summary: Toggle user active status (Admin/IT only)
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User status updated
 */
router.put('/users/:id/status', toggleUserStatus);

/**
 * @swagger
 * /auth/users/{id}/reset-password:
 *   put:
 *     summary: Reset user password (Admin/IT only)
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
router.put('/users/:id/reset-password', resetUserPassword);

/**
 * @swagger
 * /auth/system/stats:
 *   get:
 *     summary: Get system health stats
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: System statistics including user counts and database info
 */
router.get('/system/stats', getSystemStats);

/**
 * @swagger
 * /auth/system/reports:
 *   get:
 *     summary: Get system usage reports
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Aggregated system usage data
 */
router.get('/system/reports', getSystemReports);

module.exports = router;

