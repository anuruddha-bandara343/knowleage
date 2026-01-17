/**
 * Validation Middleware - Request Validation
 */

const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });

        if (error) {
            const messages = error.details.map(detail => detail.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: messages
            });
        }

        next();
    };
};

// Common validation helpers
const validators = {
    isEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    isStrongPassword: (password) => {
        return password && password.length >= 4;
    },

    isValidRole: (role) => {
        const validRoles = ['NewHire', 'Consultant', 'SeniorConsultant', 'ProjectManager', 'KnowledgeChampion', 'KnowledgeGovernanceCouncil', 'ITInfrastructure'];
        return validRoles.includes(role);
    },

    isValidStatus: (status) => {
        const validStatuses = ['Draft', 'Pending', 'Approved', 'Rejected', 'Archived'];
        return validStatuses.includes(status);
    },

    sanitizeString: (str) => {
        if (!str) return '';
        return str.trim().replace(/<[^>]*>/g, '');
    }
};

// Manual validation middleware
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }

    if (!validators.isEmail(email)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid email format'
        });
    }

    next();
};

const validateRegister = (req, res, next) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Name, email and password are required'
        });
    }

    if (!validators.isEmail(email)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid email format'
        });
    }

    if (!validators.isStrongPassword(password)) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 4 characters'
        });
    }

    next();
};

const validateDocument = (req, res, next) => {
    const { title } = req.body;

    if (!title || title.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Document title is required'
        });
    }

    next();
};

module.exports = {
    validateRequest,
    validators,
    validateLogin,
    validateRegister,
    validateDocument
};
