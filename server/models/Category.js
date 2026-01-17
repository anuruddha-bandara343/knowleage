const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        trim: true
    },
    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    icon: {
        type: String,
        default: '📁'
    },
    color: {
        type: String,
        default: '#6366f1'
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    documentCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Pre-save hook to generate slug
categorySchema.pre('save', function (next) {
    if (this.isModified('name')) {
        this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    next();
});

categorySchema.index({ parentCategory: 1 });
categorySchema.index({ order: 1 });

module.exports = mongoose.model('Category', categorySchema);
