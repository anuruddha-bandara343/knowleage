/**
 * Logger Utility - Centralized Logging
 */

const LOG_LEVELS = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
};

const formatMessage = (level, message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    return `[${timestamp}] [${level}] ${message} ${metaStr}`.trim();
};

const logger = {
    error: (message, meta = {}) => {
        console.error(formatMessage(LOG_LEVELS.ERROR, message, meta));
    },

    warn: (message, meta = {}) => {
        console.warn(formatMessage(LOG_LEVELS.WARN, message, meta));
    },

    info: (message, meta = {}) => {
        console.log(formatMessage(LOG_LEVELS.INFO, message, meta));
    },

    debug: (message, meta = {}) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(formatMessage(LOG_LEVELS.DEBUG, message, meta));
        }
    },

    request: (req) => {
        const meta = {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('user-agent')
        };
        console.log(formatMessage(LOG_LEVELS.INFO, 'Request', meta));
    }
};

module.exports = logger;
