# DKN Activity & Class Mapping

## Authentication & User Management

| Functionality | File | REST API / Config |
|---------------|------|-------------------|
| User Registration | `server/controllers/authController.js` | `register()` POST `/api/auth/register` |
| User Login | `server/controllers/authController.js` | `login()` POST `/api/auth/login` |
| Get Current User Profile | `server/controllers/authController.js` | `getCurrentUser()` GET `/api/auth/me/:userId` |
| Upload Profile Image | `server/controllers/authController.js` | `uploadProfileImage()` POST `/api/auth/profile-image` |
| Get All Users (Admin) | `server/controllers/authController.js` | `getAllUsers()` GET `/api/auth/users` |
| Update User Role | `server/controllers/authController.js` | `updateUserRole()` PUT `/api/auth/users/:id/role` |
| Delete User | `server/controllers/authController.js` | `deleteUser()` DELETE `/api/auth/users/:id` |
| Toggle User Status | `server/controllers/authController.js` | `toggleUserStatus()` PUT `/api/auth/users/:id/status` |
| Reset User Password | `server/controllers/authController.js` | `resetUserPassword()` PUT `/api/auth/users/:id/reset-password` |

## Notifications

| Functionality | File | REST API / Config |
|---------------|------|-------------------|
| Get User Notifications | `server/controllers/authController.js` | `getNotifications()` GET `/api/auth/notifications/:userId` |
| Mark Notification as Read | `server/controllers/authController.js` | `markNotificationRead()` PUT `/api/auth/notifications/:notificationId/read` |

## Document Management

| Functionality | File | REST API / Config |
|---------------|------|-------------------|
| Upload Document | `server/controllers/uploadController.js` | `uploadDocument()` POST `/api/documents/upload` |
| Get Single Document | `server/controllers/uploadController.js` | `getDocument()` GET `/api/documents/:id` |
| Get All Documents | `server/controllers/uploadController.js` | `getAllDocuments()` GET `/api/documents` |
| Like/Unlike Document | `server/controllers/ratingController.js` | `toggleLike()` POST `/api/documents/:id/like` |
| Add Comment | `server/controllers/ratingController.js` | `addComment()` POST `/api/documents/:id/comment` |
| Rate Document | `server/controllers/ratingController.js` | `rateDocument()` POST `/api/documents/:id/rate` |
| Get Document Versions | `server/controllers/uploadController.js` | `getVersions()` GET `/api/documents/:id/versions` |

## Search & Recommendations

| Functionality | File | REST API / Config |
|---------------|------|-------------------|
| Search Documents | `server/controllers/searchController.js` | `searchDocuments()` GET `/api/documents/search` |
| Get Search Suggestions | `server/controllers/searchController.js` | `getSearchSuggestions()` GET `/api/documents/search/suggestions` |
| Get Document Statistics | `server/controllers/searchController.js` | `getDocumentStats()` GET `/api/documents/stats` |
| Get AI Recommendations | `server/controllers/searchController.js` | `getRecommendations()` GET `/api/documents/recommendations` |

## Review & Approval Workflow

| Functionality | File | REST API / Config |
|---------------|------|-------------------|
| Update Document Status | `server/controllers/reviewController.js` | `updateDocumentStatus()` PUT `/api/documents/:id/status` |
| Get Pending Documents | `server/controllers/reviewController.js` | `getPendingDocuments()` GET `/api/documents/pending` |
| Get Document History | `server/controllers/reviewController.js` | `getDocumentHistory()` GET `/api/documents/:id/history` |

## NLP & Text Analysis (Services)

| Functionality | File | Method |
|---------------|------|--------|
| Check Duplicate Content | `server/services/nlp.service.js` | `checkDuplicate()` |
| Calculate Text Similarity | `server/services/nlp.service.js` | `jaccardSimilarity()` |
| Extract Keywords | `server/services/nlp.service.js` | `extractKeywords()` |
| Suggest Tags | `server/services/nlp.service.js` | `suggestTags()` |
| Calculate Quality Score | `server/services/nlp.service.js` | `calculateQualityScore()` |
| Detect Compliance Issues | `server/services/nlp.service.js` | `detectComplianceIssues()` |

## Gamification & Leaderboard

| Functionality | File | REST API / Method |
|---------------|------|-------------------|
| Get Leaderboard | `server/controllers/authController.js` | `getLeaderboard()` GET `/api/auth/leaderboard` |
| Award Points | `server/services/gamification.service.js` | `awardPoints()` |
| Check/Award Badges | `server/services/gamification.service.js` | `checkAndAwardBadges()` |
| Get User Rank | `server/services/gamification.service.js` | `getUserRank()` |
| Get Score Breakdown | `server/services/gamification.service.js` | `getScoreBreakdown()` |

## Governance & Compliance

| Functionality | File | REST API / Config |
|---------------|------|-------------------|
| Get All Metadata Rules | `server/controllers/governanceController.js` | `getAllRules()` GET `/api/governance/rules` |
| Create Metadata Rule | `server/controllers/governanceController.js` | `createRule()` POST `/api/governance/rules` |
| Update Metadata Rule | `server/controllers/governanceController.js` | `updateRule()` PUT `/api/governance/rules/:id` |
| Delete Metadata Rule | `server/controllers/governanceController.js` | `deleteRule()` DELETE `/api/governance/rules/:id` |
| Get All Audit Logs | `server/controllers/governanceController.js` | `getAllAuditLogs()` GET `/api/governance/audit` |
| Get Flagged Documents | `server/controllers/governanceController.js` | `getFlaggedDocuments()` GET `/api/governance/flagged` |
| Flag/Unflag Document | `server/controllers/governanceController.js` | `toggleFlag()` PUT `/api/governance/flag/:id` |

## Onboarding (New Hires)

| Functionality | File | REST API / Config |
|---------------|------|-------------------|
| Get Onboarding Modules | `server/controllers/onboardingController.js` | `getOnboardingModules()` GET `/api/onboarding/modules` |
| Update Onboarding Progress | `server/controllers/onboardingController.js` | `updateProgress()` PUT `/api/onboarding/progress` |
| Get Recommendations | `server/controllers/onboardingController.js` | `getNewHireRecommendations()` GET `/api/onboarding/recommendations` |

## System & Admin

| Functionality | File | REST API / Config |
|---------------|------|-------------------|
| Get System Stats | `server/controllers/authController.js` | `getSystemStats()` GET `/api/auth/system/stats` |
| Get System Usage Reports | `server/controllers/authController.js` | `getSystemReports()` GET `/api/auth/system/reports` |

## Knowledge Champion Features

| Functionality | File | REST API / Config |
|---------------|------|-------------------|
| Get Team Members | `server/controllers/kcController.js` | `getTeamMembers()` GET `/api/kc/team` |
| Get Training Resources | `server/controllers/kcController.js` | `getTrainingResources()` GET `/api/kc/training` |
| Get Engagement Metrics | `server/controllers/kcController.js` | `getEngagementMetrics()` GET `/api/kc/engagement` |

## Project Manager Features

| Functionality | File | REST API / Config |
|---------------|------|-------------------|
| Get Team Overview | `server/controllers/pmController.js` | `getTeamOverview()` GET `/api/pm/team` |
| Get Usage Reports | `server/controllers/pmController.js` | `getUsageReports()` GET `/api/pm/reports` |
| Get Knowledge Assets | `server/controllers/pmController.js` | `getKnowledgeAssets()` GET `/api/pm/assets` |

## Senior Consultant Features

| Functionality | File | REST API / Config |
|---------------|------|-------------------|
| Get Pending Reviews | `server/controllers/scController.js` | `getPendingReviews()` GET `/api/sc/pending` |
| Get Repository Curation | `server/controllers/scController.js` | `getRepositoryCuration()` GET `/api/sc/repository` |
| Get Usage Monitoring | `server/controllers/scController.js` | `getUsageMonitoring()` GET `/api/sc/usage` |

## Consultant Features

| Functionality | File | REST API / Config |
|---------------|------|-------------------|
| Get My Uploads | `server/controllers/consultantController.js` | `getMyUploads()` GET `/api/consultant/my-uploads` |
| Get Recommendations | `server/controllers/consultantController.js` | `getRecommendations()` GET `/api/consultant/recommendations` |
| Get My Activity | `server/controllers/consultantController.js` | `getMyActivity()` GET `/api/consultant/activity` |

## AI Chatbot Assistant

| Functionality | File | REST API / Config |
|---------------|------|-------------------|
| Chat with AI Assistant | `server/controllers/chatbotController.js` | `chat()` POST `/api/chatbot/chat` |
| Quick Response | `server/controllers/chatbotController.js` | `quickResponse()` POST `/api/chatbot/quick` |
| Get AI Recommendations | `server/services/recommendation.service.js` | `RecommendationService.getRecommendations()` |
