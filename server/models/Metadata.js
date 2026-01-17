const mongoose = require('mongoose');

const metadataSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    value: {
        type: String,
        required: true,
        trim: true
    },
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true
    },
    dataType: {
        type: String,
        enum: ['string', 'number', 'date', 'boolean', 'array'],
        default: 'string'
    },
    isRequired: {
        type: Boolean,
        default: false
    },
    isSearchable: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

metadataSchema.index({ documentId: 1, key: 1 }, { unique: true });
metadataSchema.index({ key: 1, value: 1 });

module.exports = mongoose.model('Metadata', metadataSchema);
