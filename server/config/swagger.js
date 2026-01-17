const swaggerJSDoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'DKN Knowledge Base CMS API',
            version: '2.0.0',
            description: `
## Digital Knowledge Network (DKN) System API

A comprehensive knowledge management system built for enterprise use with role-based access control.

### Features
- **Document Management**: Upload, version control, and approval workflows
- **Role-Based Access**: 8 user roles with specific permissions
- **Gamification**: Points, badges, and leaderboard
- **Compliance**: GDPR checks and audit logging
- **AI Features**: Recommendations and duplicate detection
            `
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
                description: 'Development Server'
            }
        ],
        tags: [
            { name: 'Auth', description: 'Authentication & User Management' },
            { name: 'Documents', description: 'Document Upload & Management' },
            { name: 'Review', description: 'Document Review & Approval' },
            { name: 'Search', description: 'Search & Recommendations' },
            { name: 'Governance', description: 'Compliance & Governance' },
            { name: 'Onboarding', description: 'New Hire Onboarding' },
            { name: 'Knowledge Champion', description: 'KC Features' },
            { name: 'Project Manager', description: 'PM Features' },
            { name: 'Senior Consultant', description: 'SC Review Features' },
            { name: 'Consultant', description: 'Consultant Dashboard' }
        ],
        components: {
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        userId: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        role: {
                            type: 'string',
                            enum: ['NewHire', 'Consultant', 'SeniorConsultant', 'ProjectManager',
                                'KnowledgeChampion', 'KnowledgeGovernanceCouncil', 'ITInfrastructure', 'Admin']
                        },
                        score: { type: 'number' },
                        badges: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    description: { type: 'string' },
                                    icon: { type: 'string' },
                                    earnedAt: { type: 'string', format: 'date-time' }
                                }
                            }
                        },
                        department: { type: 'string' },
                        isActive: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                Document: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        documentId: { type: 'string', format: 'uuid' },
                        title: { type: 'string' },
                        description: { type: 'string' },
                        status: {
                            type: 'string',
                            enum: ['Draft', 'Pending', 'Approved', 'Rejected', 'Archived']
                        },
                        domain: { type: 'string' },
                        region: { type: 'string' },
                        tags: { type: 'array', items: { type: 'string' } },
                        fileUrls: { type: 'array', items: { type: 'string' } },
                        uploader: { $ref: '#/components/schemas/User' },
                        averageRating: { type: 'number' },
                        isSensitive: { type: 'boolean' },
                        complianceFlag: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'admin@knowledgeshare.org' },
                        password: { type: 'string', example: '123456' }
                    }
                },
                RegisterRequest: {
                    type: 'object',
                    required: ['name', 'email', 'password'],
                    properties: {
                        name: { type: 'string', example: 'John Doe' },
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string', minLength: 4 },
                        role: { type: 'string', default: 'Consultant' },
                        department: { type: 'string' }
                    }
                },
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string' },
                        data: { type: 'object' }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string' }
                    }
                }
            }
        }
    },
    apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
