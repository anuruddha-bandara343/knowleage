const express = require('express');
const router = express.Router();
const { upload } = require('../utils/fileUpload');
const {
    uploadDocument,
    getDocument,
    getAllDocuments
} = require('../controllers/uploadController');
const {
    updateDocumentStatus,
    getPendingDocuments,
    getDocumentHistory
} = require('../controllers/reviewController');
const {
    searchDocuments,
    getSearchSuggestions,
    getDocumentStats,
    getRecommendations
} = require('../controllers/searchController');
const { rateDocument } = require('../controllers/ratingController');
const { addComment, deleteComment } = require('../controllers/commentController');
const { toggleLike } = require('../controllers/interactionController');

// ========== IUpload Interface ==========
/**
 * @swagger
 * /documents/upload:
 *   post:
 *     summary: Upload document with files
 *     description: Upload a new document with optional file attachments. Includes duplicate detection and compliance checks.
 *     tags: [Documents]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - userId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               domain:
 *                 type: string
 *               region:
 *                 type: string
 *               tags:
 *                 type: string
 *                 description: Comma-separated tags
 *               userId:
 *                 type: string
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       400:
 *         description: Validation error
 */
router.post('/upload', upload.array('files', 10), uploadDocument);

// ========== ISearch Interface ==========
/**
 * @swagger
 * /documents:
 *   get:
 *     summary: Get all documents
 *     description: Get all documents with role-based visibility
 *     tags: [Documents]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Pending, Approved, Rejected, Archived]
 *       - in: query
 *         name: domain
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of documents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 documents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Document'
 */
router.get('/', getAllDocuments);

/**
 * @swagger
 * /documents/search:
 *   get:
 *     summary: Search documents
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: domain
 *         schema:
 *           type: string
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', searchDocuments);

/**
 * @swagger
 * /documents/suggestions:
 *   get:
 *     summary: Get search suggestions
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of suggestions
 */
router.get('/suggestions', getSearchSuggestions);

/**
 * @swagger
 * /documents/stats:
 *   get:
 *     summary: Get document statistics
 *     tags: [Documents]
 *     responses:
 *       200:
 *         description: Document stats (counts by status, domain, etc.)
 */
router.get('/stats', getDocumentStats);

/**
 * @swagger
 * /documents/recommendations:
 *   get:
 *     summary: Get AI recommendations
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recommended documents based on user activity
 */
router.get('/recommendations', getRecommendations);

/**
 * @swagger
 * /documents/pending:
 *   get:
 *     summary: Get pending documents for review
 *     tags: [Review]
 *     responses:
 *       200:
 *         description: List of documents awaiting approval
 */
router.get('/pending', getPendingDocuments);

/**
 * @swagger
 * /documents/{id}:
 *   get:
 *     summary: Get single document
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Document'
 *       404:
 *         description: Document not found
 */
router.get('/:id', getDocument);

/**
 * @swagger
 * /documents/{id}/history:
 *   get:
 *     summary: Get document audit history
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audit log history
 */
router.get('/:id/history', getDocumentHistory);

// ========== IReview Interface ==========
/**
 * @swagger
 * /documents/{id}/status:
 *   put:
 *     summary: Update document status (Approve/Reject)
 *     tags: [Review]
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
 *             required:
 *               - status
 *               - reviewerId
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Approved, Rejected, Pending]
 *               reviewerId:
 *                 type: string
 *               reason:
 *                 type: string
 *                 description: Rejection reason (if rejecting)
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/:id/status', updateDocumentStatus);

/**
 * @swagger
 * /documents/{id}/rate:
 *   post:
 *     summary: Rate a document
 *     tags: [Documents]
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
 *               userId:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       200:
 *         description: Rating submitted
 */
router.post('/:id/rate', rateDocument);

/**
 * @swagger
 * /documents/{id}/comments:
 *   post:
 *     summary: Add a comment
 *     tags: [Documents]
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
 *               userId:
 *                 type: string
 *               text:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added
 */
router.post('/:id/comments', addComment);

/**
 * @swagger
 * /documents/{id}/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment deleted
 */
router.delete('/:id/comments/:commentId', deleteComment);

/**
 * @swagger
 * /documents/{id}/like:
 *   post:
 *     summary: Toggle like status
 *     tags: [Documents]
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
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Like toggled
 */
router.post('/:id/like', toggleLike);

module.exports = router;

