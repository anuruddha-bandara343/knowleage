const express = require('express');
const router = express.Router();

const {
    getAllRules,
    createRule,
    updateRule,
    deleteRule,
    getAllAuditLogs,
    getFlaggedDocuments,
    toggleFlag
} = require('../controllers/governanceController');

// ========== Metadata Rules Routes ==========

/**
 * @swagger
 * /governance/rules:
 *   get:
 *     summary: Get all metadata rules
 *     tags: [Governance]
 *     responses:
 *       200:
 *         description: List of metadata validation rules
 */
router.get('/rules', getAllRules);

/**
 * @swagger
 * /governance/rules:
 *   post:
 *     summary: Create a new metadata rule
 *     tags: [Governance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               field:
 *                 type: string
 *               required:
 *                 type: boolean
 *               regex:
 *                 type: string
 *     responses:
 *       201:
 *         description: Rule created
 */
router.post('/rules', createRule);

/**
 * @swagger
 * /governance/rules/{id}:
 *   put:
 *     summary: Update a metadata rule
 *     tags: [Governance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rule updated
 */
router.put('/rules/:id', updateRule);

/**
 * @swagger
 * /governance/rules/{id}:
 *   delete:
 *     summary: Delete a metadata rule
 *     tags: [Governance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rule deleted
 */
router.delete('/rules/:id', deleteRule);

// ========== Audit Logs Routes ==========

/**
 * @swagger
 * /governance/audit:
 *   get:
 *     summary: Get all audit logs
 *     tags: [Governance]
 *     parameters:
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audit log entries
 */
router.get('/audit', getAllAuditLogs);

// ========== Flagged Content Routes ==========

/**
 * @swagger
 * /governance/flagged:
 *   get:
 *     summary: Get all flagged documents
 *     tags: [Governance]
 *     responses:
 *       200:
 *         description: List of flagged documents for compliance review
 */
router.get('/flagged', getFlaggedDocuments);

/**
 * @swagger
 * /governance/flag/{id}:
 *   put:
 *     summary: Flag or unflag a document
 *     tags: [Governance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               flagged:
 *                 type: boolean
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Flag status updated
 */
router.put('/flag/:id', toggleFlag);

module.exports = router;
