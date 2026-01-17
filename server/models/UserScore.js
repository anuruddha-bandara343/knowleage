const mongoose = require('mongoose');

const userScoreSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    totalScore: {
        type: Number,
        default: 0
    },
    breakdown: {
        uploads: {
            count: { type: Number, default: 0 },
            points: { type: Number, default: 0 }
        },
        reviews: {
            count: { type: Number, default: 0 },
            points: { type: Number, default: 0 }
        },
        likes: {
            received: { type: Number, default: 0 },
            points: { type: Number, default: 0 }
        },
        comments: {
            count: { type: Number, default: 0 },
            points: { type: Number, default: 0 }
        },
        training: {
            completed: { type: Number, default: 0 },
            points: { type: Number, default: 0 }
        },
        other: {
            description: String,
            points: { type: Number, default: 0 }
        }
    },
    history: [{
        action: {
            type: String,
            required: true
        },
        points: {
            type: Number,
            required: true
        },
        description: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        relatedDocument: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Document'
        }
    }],
    level: {
        type: Number,
        default: 1
    },
    nextLevelPoints: {
        type: Number,
        default: 100
    }
}, {
    timestamps: true
});

userScoreSchema.index({ userId: 1 }, { unique: true });
userScoreSchema.index({ totalScore: -1 });

// Point values
const POINT_VALUES = {
    UPLOAD: 10,
    REVIEW: 5,
    LIKE_RECEIVED: 2,
    COMMENT: 1,
    TRAINING_COMPLETE: 15
};

// Method to add points
userScoreSchema.methods.addPoints = function (action, points, description, docId = null) {
    this.totalScore += points;
    this.history.push({
        action,
        points,
        description,
        relatedDocument: docId
    });

    // Update breakdown
    switch (action) {
        case 'UPLOAD':
            this.breakdown.uploads.count++;
            this.breakdown.uploads.points += points;
            break;
        case 'REVIEW':
            this.breakdown.reviews.count++;
            this.breakdown.reviews.points += points;
            break;
        case 'LIKE_RECEIVED':
            this.breakdown.likes.received++;
            this.breakdown.likes.points += points;
            break;
        case 'COMMENT':
            this.breakdown.comments.count++;
            this.breakdown.comments.points += points;
            break;
        case 'TRAINING':
            this.breakdown.training.completed++;
            this.breakdown.training.points += points;
            break;
    }

    // Check level up
    this.checkLevelUp();

    return this;
};

userScoreSchema.methods.checkLevelUp = function () {
    const pointsPerLevel = 100;
    const newLevel = Math.floor(this.totalScore / pointsPerLevel) + 1;
    if (newLevel > this.level) {
        this.level = newLevel;
    }
    this.nextLevelPoints = (this.level * pointsPerLevel) - this.totalScore;
};

userScoreSchema.statics.POINT_VALUES = POINT_VALUES;

module.exports = mongoose.model('UserScore', userScoreSchema);
