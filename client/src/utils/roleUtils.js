/**
 * Role Utilities
 */

export const ROLES = {
    NEW_HIRE: 'NewHire',
    CONSULTANT: 'Consultant',
    SENIOR_CONSULTANT: 'SeniorConsultant',
    PROJECT_MANAGER: 'ProjectManager',
    KNOWLEDGE_CHAMPION: 'KnowledgeChampion',
    KNOWLEDGE_GOVERNANCE_COUNCIL: 'KnowledgeGovernanceCouncil',
    IT_INFRASTRUCTURE: 'ITInfrastructure'
};

export const ROLE_LABELS = {
    NewHire: 'New Hire',
    Consultant: 'Consultant',
    SeniorConsultant: 'Senior Consultant',
    ProjectManager: 'Project Manager',
    KnowledgeChampion: 'Knowledge Champion',
    KnowledgeGovernanceCouncil: 'Knowledge Governance Council',
    ITInfrastructure: 'IT Infrastructure'
};

export const ROLE_COLORS = {
    NewHire: '#10b981',
    Consultant: '#6b7280',
    SeniorConsultant: '#3b82f6',
    ProjectManager: '#8b5cf6',
    KnowledgeChampion: '#f59e0b',
    KnowledgeGovernanceCouncil: '#ef4444',
    ITInfrastructure: '#ec4899'
};

export const ROLE_ICONS = {
    NewHire: '🌱',
    Consultant: '💼',
    SeniorConsultant: '⭐',
    ProjectManager: '📊',
    KnowledgeChampion: '🏆',
    KnowledgeGovernanceCouncil: '⚖️',
    ITInfrastructure: '🔧'
};

/**
 * Get human-readable role label
 */
export const getRoleLabel = (role) => {
    return ROLE_LABELS[role] || role;
};

/**
 * Get role color
 */
export const getRoleColor = (role) => {
    return ROLE_COLORS[role] || '#6b7280';
};

/**
 * Get role icon
 */
export const getRoleIcon = (role) => {
    return ROLE_ICONS[role] || '👤';
};

/**
 * Check if user has one of the specified roles
 */
export const hasRole = (userRole, allowedRoles) => {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    return roles.includes(userRole);
};

/**
 * Check if user is admin
 */
export const isAdmin = (userRole) => {
    return hasRole(userRole, [ROLES.IT_INFRASTRUCTURE]);
};

/**
 * Check if user can review documents
 */
export const canReview = (userRole) => {
    return hasRole(userRole, [
        ROLES.SENIOR_CONSULTANT,
        ROLES.PROJECT_MANAGER,
        ROLES.KNOWLEDGE_CHAMPION,
        ROLES.KNOWLEDGE_GOVERNANCE_COUNCIL,
        ROLES.IT_INFRASTRUCTURE
    ]);
};

/**
 * Check if user can upload documents
 */
export const canUpload = (userRole) => {
    return hasRole(userRole, [
        ROLES.CONSULTANT,
        ROLES.SENIOR_CONSULTANT,
        ROLES.PROJECT_MANAGER,
        ROLES.KNOWLEDGE_CHAMPION,
        ROLES.KNOWLEDGE_GOVERNANCE_COUNCIL,
        ROLES.IT_INFRASTRUCTURE
    ]);
};

/**
 * Get dashboard component name for role
 */
export const getDashboardForRole = (role) => {
    const dashboards = {
        NewHire: 'NewHireDashboard',
        Consultant: 'ConsultantDashboard',
        SeniorConsultant: 'SCDashboard',
        ProjectManager: 'PMDashboard',
        KnowledgeChampion: 'KCDashboard',
        KnowledgeGovernanceCouncil: 'GovernanceDashboard',
        ITInfrastructure: 'ITDashboard'
    };
    return dashboards[role] || 'ConsultantDashboard';
};

export default {
    ROLES,
    ROLE_LABELS,
    ROLE_COLORS,
    ROLE_ICONS,
    getRoleLabel,
    getRoleColor,
    getRoleIcon,
    hasRole,
    isAdmin,
    canReview,
    canUpload,
    getDashboardForRole
};
