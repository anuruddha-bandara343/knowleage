/**
 * Metadata Validator Utility
 */

const REQUIRED_METADATA_KEYS = ['domain', 'region'];

const VALID_DOMAINS = [
    'Engineering',
    'Finance',
    'Human Resources',
    'Marketing',
    'Sales',
    'Operations',
    'Legal',
    'IT',
    'Research',
    'Customer Service',
    'Other'
];

const VALID_REGIONS = [
    'North America',
    'Europe',
    'Asia Pacific',
    'Latin America',
    'Middle East',
    'Africa',
    'Global'
];

/**
 * Validate metadata array
 * @param {Array} metadata - Array of {key, value} objects
 * @returns {Object} - { isValid, errors, warnings }
 */
const validateMetadata = (metadata = []) => {
    const errors = [];
    const warnings = [];

    if (!Array.isArray(metadata)) {
        return { isValid: false, errors: ['Metadata must be an array'], warnings: [] };
    }

    // Check for required keys
    const keys = metadata.map(m => m.key?.toLowerCase());

    REQUIRED_METADATA_KEYS.forEach(requiredKey => {
        if (!keys.includes(requiredKey.toLowerCase())) {
            warnings.push(`Recommended metadata key '${requiredKey}' is missing`);
        }
    });

    // Validate each metadata entry
    metadata.forEach((item, index) => {
        if (!item.key || typeof item.key !== 'string') {
            errors.push(`Metadata item ${index + 1}: key is required and must be a string`);
        }
        if (!item.value || typeof item.value !== 'string') {
            errors.push(`Metadata item ${index + 1}: value is required and must be a string`);
        }

        // Validate domain value if present
        if (item.key?.toLowerCase() === 'domain' && !VALID_DOMAINS.includes(item.value)) {
            warnings.push(`Domain '${item.value}' is not in the standard list`);
        }

        // Validate region value if present
        if (item.key?.toLowerCase() === 'region' && !VALID_REGIONS.includes(item.value)) {
            warnings.push(`Region '${item.value}' is not in the standard list`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
};

/**
 * Check compliance for GDPR
 * @param {Array} metadata - Metadata array
 * @param {string} region - Region string
 * @returns {Object} - Compliance result
 */
const checkGDPRCompliance = (metadata = [], region = '') => {
    const isEU = region?.toLowerCase().includes('eu') ||
        region?.toLowerCase().includes('europe') ||
        metadata?.some(m =>
            m.key?.toLowerCase() === 'region' &&
            (m.value?.toLowerCase().includes('eu') || m.value?.toLowerCase().includes('europe'))
        );

    const hasPersonalData = metadata?.some(m =>
        (m.key?.toLowerCase().includes('data') || m.key?.toLowerCase().includes('pii')) &&
        (m.value?.toLowerCase().includes('personal') || m.value?.toLowerCase().includes('sensitive'))
    );

    if (isEU && hasPersonalData) {
        return {
            compliant: false,
            isSensitive: true,
            reason: 'GDPR Compliance: Document contains personal data from EU region and requires additional review.'
        };
    }

    return { compliant: true, isSensitive: false };
};

module.exports = {
    validateMetadata,
    checkGDPRCompliance,
    REQUIRED_METADATA_KEYS,
    VALID_DOMAINS,
    VALID_REGIONS
};
