const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Document Version subdocument schema (Composition Pattern)
const documentVersionSchema = new mongoose.Schema({
    versionId: {
        type: String,
        default: () => uuidv4()
    },
    versionNum: {
        type: Number,
        required: true
    },
    fileUrl: {
        type: String,
        required: false  // Allow documents without file attachments
    },
    changelog: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { _id: false });

// Metadata subdocument schema
const metadataSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        trim: true
    },
    value: {
        type: String,
        required: true,
        trim: true
    }
}, { _id: false });

const documentSchema = new mongoose.Schema({
    documentId: {
        type: String,
        default: () => uuidv4(),
        unique: true,
        index: true
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        index: true
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['Draft', 'Pending', 'Approved', 'Rejected', 'Archived'],
        default: 'Pending',
        index: true
    },
    isSensitive: {
        type: Boolean,
        default: false
    },
    complianceNotes: {
        type: String
    },
    // Legacy metadata fields for backward compatibility
    domain: {
        type: String,
        trim: true
    },
    region: {
        type: String,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    // New flexible metadata array
    metadata: [metadataSchema],
    // Multiple file URLs for images/attachments
    fileUrls: [{
        type: String,
        trim: true
    }],
    versions: [documentVersionSchema],
    uploader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    },
    rejectionReason: {
        type: String
    },
    // Duplicate detection
    isDuplicateWarning: {
        type: Boolean,
        default: false
    },
    similarDocumentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
    },
    // Compliance flagging for KGC
    complianceFlag: {
        type: Boolean,
        default: false,
        index: true
    },
    flagReason: {
        type: String,
        trim: true
    },
    // Ratings
    ratings: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    averageRating: {
        type: Number,
        default: 0
    },
    // Comments
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        text: {
            type: String,
            required: true,
            trim: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Compound indexes for efficient queries
documentSchema.index({ status: 1, createdAt: -1 });
documentSchema.index({ uploader: 1, status: 1 });
documentSchema.index({ title: 'text', description: 'text' });

// Virtual for current version
documentSchema.virtual('currentVersion').get(function () {
    if (this.versions && this.versions.length > 0) {
        return this.versions[this.versions.length - 1];
    }
    return null;
});

// Virtual for version count
documentSchema.virtual('versionCount').get(function () {
    return this.versions ? this.versions.length : 0;
});

// Method to add new version
documentSchema.methods.addVersion = function (fileUrl, userId, changelog = '') {
    const newVersionNum = this.versions.length + 1;
    this.versions.push({
        versionNum: newVersionNum,
        fileUrl,
        changelog,
        createdBy: userId,
        createdAt: new Date()
    });
    return newVersionNum;
};

// Static method for duplicate detection (simulated NLP - 80% similarity)
documentSchema.statics.findSimilarByTitle = async function (title, threshold = 0.8) {
    const normalizedTitle = title.toLowerCase().trim();
    const words = normalizedTitle.split(/\s+/);

    // Get all documents
    const allDocs = await this.find({}, 'title _id');

    const similar = [];

    for (const doc of allDocs) {
        const docTitle = doc.title.toLowerCase().trim();
        const docWords = docTitle.split(/\s+/);

        // Calculate Jaccard similarity
        const intersection = words.filter(w => docWords.includes(w));
        const union = [...new Set([...words, ...docWords])];
        const similarity = intersection.length / union.length;

        if (similarity >= threshold) {
            similar.push({
                document: doc,
                similarity: Math.round(similarity * 100)
            });
        }
    }

    return similar.sort((a, b) => b.similarity - a.similarity);
};

// Static method for compliance check
documentSchema.statics.checkCompliance = function (metadata, region) {
    // GDPR Check: If Region is EU and contains personal data
    const isEU = region?.toLowerCase().includes('eu') ||
        metadata?.some(m => m.key.toLowerCase() === 'region' && m.value.toLowerCase().includes('eu'));

    const hasPersonalData = metadata?.some(m =>
        (m.key.toLowerCase() === 'data' || m.key.toLowerCase() === 'datatype') &&
        m.value.toLowerCase().includes('personal')
    );

    if (isEU && hasPersonalData) {
        return {
            passed: false,
            isSensitive: true,
            reason: 'GDPR Compliance: Document contains personal data from EU region and requires additional review.'
        };
    }

    return { passed: true, isSensitive: false };
};

module.exports = mongoose.model('Document', documentSchema);
