const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
    period: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'allTime'],
        required: true
    },
    periodStart: {
        type: Date,
        required: true
    },
    periodEnd: {
        type: Date,
        required: true
    },
    rankings: [{
        rank: {
            type: Number,
            required: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        score: {
            type: Number,
            required: true
        },
        previousRank: {
            type: Number
        },
        rankChange: {
            type: Number,
            default: 0
        },
        uploads: {
            type: Number,
            default: 0
        },
        reviews: {
            type: Number,
            default: 0
        },
        likes: {
            type: Number,
            default: 0
        }
    }],
    isFinalized: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

leaderboardSchema.index({ period: 1, periodStart: -1 });
leaderboardSchema.index({ 'rankings.userId': 1 });

// Static method to get current leaderboard
leaderboardSchema.statics.getCurrentLeaderboard = async function (period = 'allTime') {
    const now = new Date();
    return this.findOne({
        period,
        periodStart: { $lte: now },
        periodEnd: { $gte: now }
    }).populate('rankings.userId', 'name email role department profileImage');
};

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
