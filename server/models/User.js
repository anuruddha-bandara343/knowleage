const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Badge subdocument schema
const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  earnedAt: {
    type: Date,
    default: Date.now
  },
  icon: {
    type: String,
    default: '🏆'
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [4, 'Password must be at least 4 characters']
  },
  role: {
    type: String,
    enum: ['NewHire', 'Consultant', 'SeniorConsultant', 'ProjectManager', 'KnowledgeChampion', 'KnowledgeGovernanceCouncil', 'ITInfrastructure', 'Admin'],
    default: 'Consultant'
  },
  onboardingProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  score: {
    type: Number,
    default: 0
  },
  badges: [badgeSchema],
  department: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profileImage: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for leaderboard queries
userSchema.index({ score: -1 });
userSchema.index({ role: 1 });

// Virtual for badge count
userSchema.virtual('badgeCount').get(function () {
  return this.badges ? this.badges.length : 0;
});

// Method to add badge if not already earned
userSchema.methods.awardBadge = function (badgeName, description, icon = '🏆') {
  const hasBadge = this.badges.some(b => b.name === badgeName);
  if (!hasBadge) {
    this.badges.push({ name: badgeName, description, icon });
    return true;
  }
  return false;
};

// Static method for gamification check
userSchema.statics.checkAndAwardBadges = async function (userId) {
  const user = await this.findById(userId);
  if (!user) return null;

  const badgesAwarded = [];

  // Top Contributor badge at 100+ points
  if (user.score >= 100) {
    if (user.awardBadge('Top Contributor', 'Earned 100+ contribution points', '⭐')) {
      badgesAwarded.push('Top Contributor');
    }
  }

  // Rising Star badge at 50+ points
  if (user.score >= 50) {
    if (user.awardBadge('Rising Star', 'Earned 50+ contribution points', '🌟')) {
      badgesAwarded.push('Rising Star');
    }
  }

  // First Upload badge
  if (user.score >= 10) {
    if (user.awardBadge('First Upload', 'Completed first document upload', '📄')) {
      badgesAwarded.push('First Upload');
    }
  }

  if (badgesAwarded.length > 0) {
    await user.save();
  }

  return { user, badgesAwarded };
};

module.exports = mongoose.model('User', userSchema);
