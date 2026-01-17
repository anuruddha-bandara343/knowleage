/**
 * Role Middleware - Role-Based Access Control
 */

const { hasPermission, isRoleAtLeast, ROLES } = require('../config/roles.config');

/**
 * Restrict access to specific roles
 * @param  {...string} allowedRoles - Roles that are allowed to access the route
 */
const restrictTo = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action'
            });
        }

        next();
    };
};

/**
 * Check if user has a specific permission
 * @param {string} permission - Permission to check
 */
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!hasPermission(req.user.role, permission)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action'
            });
        }

        next();
    };
};

/**
 * Require minimum role level
 * @param {string} minRole - Minimum role required
 */
const requireMinRole = (minRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!isRoleAtLeast(req.user.role, minRole)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient role level'
            });
        }

        next();
    };
};

module.exports = {
    restrictTo,
    requirePermission,
    requireMinRole,
    ROLES
};
