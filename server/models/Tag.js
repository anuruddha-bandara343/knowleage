const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    displayName: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    color: {
        type: String,
        default: '#6366f1'
    },
    usageCount: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

tagSchema.index({ name: 'text', displayName: 'text' });
tagSchema.index({ usageCount: -1 });

// Static method to increment usage
tagSchema.statics.incrementUsage = async function (tagName) {
    return this.findOneAndUpdate(
        { name: tagName.toLowerCase() },
        { $inc: { usageCount: 1 } },
        { new: true }
    );
};

module.exports = mongoose.model('Tag', tagSchema);
