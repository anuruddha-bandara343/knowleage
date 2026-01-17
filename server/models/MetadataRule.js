const mongoose = require('mongoose');

const metadataRuleSchema = new mongoose.Schema({
    fieldName: {
        type: String,
        required: [true, 'Field name is required'],
        unique: true,
        trim: true
    },
    displayName: {
        type: String,
        trim: true
    },
    description: {
        type: String
    },
    isMandatory: {
        type: Boolean,
        default: false
    },
    validationRegex: {
        type: String
    },
    validationMessage: {
        type: String
    },
    fieldType: {
        type: String,
        enum: ['text', 'number', 'date', 'select', 'multiselect'],
        default: 'text'
    },
    options: [{
        type: String
    }],
    defaultValue: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for ordering
metadataRuleSchema.index({ order: 1, isActive: 1 });

// Static method to validate metadata against rules
metadataRuleSchema.statics.validateMetadata = async function (metadata = []) {
    const rules = await this.find({ isActive: true });
    const errors = [];

    for (const rule of rules) {
        const field = metadata.find(m => m.key === rule.fieldName);

        // Check mandatory fields
        if (rule.isMandatory && (!field || !field.value)) {
            errors.push({
                field: rule.fieldName,
                message: `${rule.displayName || rule.fieldName} is required`
            });
            continue;
        }

        // Check regex validation
        if (field && field.value && rule.validationRegex) {
            const regex = new RegExp(rule.validationRegex);
            if (!regex.test(field.value)) {
                errors.push({
                    field: rule.fieldName,
                    message: rule.validationMessage || `${rule.displayName || rule.fieldName} format is invalid`
                });
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

// Static method to get active rules
metadataRuleSchema.statics.getActiveRules = function () {
    return this.find({ isActive: true }).sort({ order: 1 });
};

module.exports = mongoose.model('MetadataRule', metadataRuleSchema);
