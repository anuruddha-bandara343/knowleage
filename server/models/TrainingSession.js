const mongoose = require('mongoose');

const trainingSessionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['Onboarding', 'Skills', 'Compliance', 'Product', 'Process'],
        default: 'Onboarding'
    },
    modules: [{
        title: String,
        description: String,
        content: String,
        duration: Number, // in minutes
        order: Number,
        isRequired: Boolean,
        resources: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Document'
        }]
    }],
    targetRoles: [{
        type: String,
        enum: ['NewHire', 'Consultant', 'SeniorConsultant', 'ProjectManager', 'KnowledgeChampion', 'KnowledgeGovernanceCouncil', 'ITInfrastructure']
    }],
    duration: {
        type: Number, // Total duration in minutes
        default: 0
    },
    passingScore: {
        type: Number,
        default: 70
    },
    isActive: {
        type: Boolean,
        default: true
    },
    enrolledUsers: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        enrolledAt: {
            type: Date,
            default: Date.now
        },
        progress: {
            type: Number,
            default: 0
        },
        completedModules: [Number],
        completedAt: Date,
        score: Number
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

trainingSessionSchema.index({ type: 1, isActive: 1 });
trainingSessionSchema.index({ 'enrolledUsers.userId': 1 });

module.exports = mongoose.model('TrainingSession', trainingSessionSchema);
