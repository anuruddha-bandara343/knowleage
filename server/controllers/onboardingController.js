const User = require('../models/User');
const Document = require('../models/Document');

/**
 * Onboarding Controller
 * For NewHire role - learning and onboarding features
 */

// Predefined onboarding modules
const ONBOARDING_MODULES = [
    {
        id: 1,
        title: 'Welcome to the Organization',
        description: 'Learn about our company culture, values, and mission.',
        icon: '🏢',
        estimatedTime: '10 min',
        tags: ['onboarding', 'culture']
    },
    {
        id: 2,
        title: 'Understanding the Knowledge System',
        description: 'How to use this platform to find and share knowledge.',
        icon: '📚',
        estimatedTime: '15 min',
        tags: ['onboarding', 'tutorial']
    },
    {
        id: 3,
        title: 'Your Role & Responsibilities',
        description: 'What is expected of you and how to grow in your role.',
        icon: '🎯',
        estimatedTime: '20 min',
        tags: ['onboarding', 'career']
    },
    {
        id: 4,
        title: 'Key Contacts & Resources',
        description: 'Who to reach out to and where to find help.',
        icon: '👥',
        estimatedTime: '10 min',
        tags: ['onboarding', 'resources']
    },
    {
        id: 5,
        title: 'Compliance & Policies',
        description: 'Important policies and guidelines to follow.',
        icon: '📋',
        estimatedTime: '25 min',
        tags: ['onboarding', 'compliance']
    }
];

/**
 * GET /api/onboarding/modules
 * Get onboarding modules for new hires
 */
exports.getOnboardingModules = async (req, res) => {
    try {
        const { userId } = req.query;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Calculate completion based on progress
        const completedCount = Math.floor((user.onboardingProgress / 100) * ONBOARDING_MODULES.length);

        const modules = ONBOARDING_MODULES.map((module, index) => ({
            ...module,
            completed: index < completedCount
        }));

        res.status(200).json({
            success: true,
            data: {
                modules,
                progress: user.onboardingProgress,
                totalModules: ONBOARDING_MODULES.length,
                completedModules: completedCount
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * PUT /api/onboarding/progress
 * Update onboarding progress
 */
exports.updateProgress = async (req, res) => {
    try {
        const { userId, moduleId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Calculate new progress
        const moduleIndex = ONBOARDING_MODULES.findIndex(m => m.id === moduleId);
        if (moduleIndex === -1) {
            return res.status(400).json({ success: false, message: 'Invalid module' });
        }

        const progressPerModule = 100 / ONBOARDING_MODULES.length;
        const newProgress = Math.min(100, (moduleIndex + 1) * progressPerModule);

        user.onboardingProgress = Math.max(user.onboardingProgress, newProgress);
        await user.save();

        res.status(200).json({
            success: true,
            data: {
                progress: user.onboardingProgress,
                message: newProgress >= 100 ? 'Congratulations! Onboarding complete!' : 'Progress updated!'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/onboarding/recommendations
 * Get personalized recommendations for new hires
 */
exports.getNewHireRecommendations = async (req, res) => {
    try {
        const { userId } = req.query;

        // Fetch documents tagged with beginner/onboarding content
        const recommendations = await Document.find({
            status: 'Approved',
            $or: [
                { tags: { $in: ['onboarding', 'beginner', 'getting-started', 'training'] } },
                { domain: { $in: ['Training', 'Onboarding', 'HR'] } }
            ]
        })
            .limit(6)
            .populate('uploader', 'name')
            .sort({ createdAt: -1 });

        // If not enough tagged content, fetch recent approved docs
        if (recommendations.length < 3) {
            const recentDocs = await Document.find({
                status: 'Approved',
                _id: { $nin: recommendations.map(r => r._id) }
            })
                .limit(6 - recommendations.length)
                .populate('uploader', 'name')
                .sort({ averageRating: -1 });

            recommendations.push(...recentDocs);
        }

        res.status(200).json({
            success: true,
            data: recommendations
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
