/**
 * Gamification Service - Points, Badges, and Leaderboard
 */

const User = require('../models/User');
const UserScore = require('../models/UserScore');
const Leaderboard = require('../models/Leaderboard');

const POINT_VALUES = {
    UPLOAD: 10,
    REVIEW: 5,
    LIKE_RECEIVED: 2,
    COMMENT: 1,
    TRAINING_COMPLETE: 15,
    FIRST_UPLOAD: 5,
    STREAK_BONUS: 10
};

const BADGES = {
    FIRST_UPLOAD: {
        name: 'First Upload',
        description: 'Completed first document upload',
        icon: '📄',
        threshold: 1,
        type: 'uploads'
    },
    RISING_STAR: {
        name: 'Rising Star',
        description: 'Earned 50+ contribution points',
        icon: '🌟',
        threshold: 50,
        type: 'score'
    },
    TOP_CONTRIBUTOR: {
        name: 'Top Contributor',
        description: 'Earned 100+ contribution points',
        icon: '⭐',
        threshold: 100,
        type: 'score'
    },
    KNOWLEDGE_GURU: {
        name: 'Knowledge Guru',
        description: 'Uploaded 10+ approved documents',
        icon: '🎓',
        threshold: 10,
        type: 'uploads'
    },
    MENTOR: {
        name: 'Mentor',
        description: 'Reviewed 20+ documents',
        icon: '🏅',
        threshold: 20,
        type: 'reviews'
    },
    POPULAR: {
        name: 'Popular',
        description: 'Received 50+ likes on documents',
        icon: '❤️',
        threshold: 50,
        type: 'likes'
    }
};

class GamificationService {
    /**
     * Award points to user
     */
    async awardPoints(userId, action, description, docId = null) {
        const points = POINT_VALUES[action] || 0;
        if (points === 0) return null;

        // Update user score
        const user = await User.findById(userId);
        if (!user) return null;

        user.score += points;
        await user.save();

        // Update detailed score record
        let userScore = await UserScore.findOne({ userId });
        if (!userScore) {
            userScore = await UserScore.create({ userId, totalScore: 0 });
        }
        userScore.addPoints(action, points, description, docId);
        await userScore.save();

        // Check for new badges
        const newBadges = await this.checkAndAwardBadges(userId);

        return {
            pointsAwarded: points,
            newTotal: user.score,
            newBadges
        };
    }

    /**
     * Check and award badges
     */
    async checkAndAwardBadges(userId) {
        const user = await User.findById(userId);
        if (!user) return [];

        const userScore = await UserScore.findOne({ userId });
        const newBadges = [];

        // Check each badge
        for (const [key, badge] of Object.entries(BADGES)) {
            // Skip if already earned
            if (user.badges.some(b => b.name === badge.name)) continue;

            let earned = false;

            switch (badge.type) {
                case 'score':
                    earned = user.score >= badge.threshold;
                    break;
                case 'uploads':
                    earned = userScore?.breakdown.uploads.count >= badge.threshold;
                    break;
                case 'reviews':
                    earned = userScore?.breakdown.reviews.count >= badge.threshold;
                    break;
                case 'likes':
                    earned = userScore?.breakdown.likes.received >= badge.threshold;
                    break;
            }

            if (earned) {
                user.badges.push({
                    name: badge.name,
                    description: badge.description,
                    icon: badge.icon,
                    earnedAt: new Date()
                });
                newBadges.push(badge);
            }
        }

        if (newBadges.length > 0) {
            await user.save();
        }

        return newBadges;
    }

    /**
     * Get leaderboard
     */
    async getLeaderboard(limit = 10, period = 'allTime') {
        // For 'allTime', just query users directly
        if (period === 'allTime') {
            const users = await User.find({ isActive: true })
                .select('name email role score badges department profileImage')
                .sort({ score: -1 })
                .limit(limit);

            return users.map((user, index) => ({
                rank: index + 1,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    department: user.department,
                    profileImage: user.profileImage
                },
                score: user.score,
                badgeCount: user.badges?.length || 0
            }));
        }

        // For periodic leaderboards, check stored snapshots
        const leaderboard = await Leaderboard.getCurrentLeaderboard(period);
        return leaderboard?.rankings || [];
    }

    /**
     * Get user rank
     */
    async getUserRank(userId) {
        const user = await User.findById(userId);
        if (!user) return null;

        const higherScoreCount = await User.countDocuments({
            isActive: true,
            score: { $gt: user.score }
        });

        return {
            rank: higherScoreCount + 1,
            score: user.score,
            badges: user.badges
        };
    }

    /**
     * Get user score breakdown
     */
    async getScoreBreakdown(userId) {
        const userScore = await UserScore.findOne({ userId });
        if (!userScore) {
            return {
                totalScore: 0,
                breakdown: {},
                history: [],
                level: 1
            };
        }

        return {
            totalScore: userScore.totalScore,
            breakdown: userScore.breakdown,
            history: userScore.history.slice(-20), // Last 20 activities
            level: userScore.level,
            nextLevelPoints: userScore.nextLevelPoints
        };
    }
}

module.exports = new GamificationService();
module.exports.POINT_VALUES = POINT_VALUES;
module.exports.BADGES = BADGES;
