import { hasRole as checkRole } from '../../utils/roleUtils';

/**
 * RoleGuard Component
 * Conditionally renders children based on user role
 */
const RoleGuard = ({
    children,
    user,
    allowedRoles = [],
    fallback = null,
    showUnauthorized = false
}) => {
    // If no user, don't show anything
    if (!user) {
        return fallback;
    }

    // Check if user has one of the allowed roles
    const hasAccess = checkRole(user.role, allowedRoles);

    if (!hasAccess) {
        if (showUnauthorized) {
            return (
                <div className="unauthorized-message">
                    <div className="unauthorized-icon">🔒</div>
                    <h3>Access Denied</h3>
                    <p>You don't have permission to view this content.</p>
                    <p className="role-info">
                        Required role: {allowedRoles.join(' or ')}
                    </p>
                </div>
            );
        }
        return fallback;
    }

    return children;
};

/**
 * HOC version
 */
export const withRole = (Component, allowedRoles) => {
    return function RoleProtectedComponent(props) {
        const { user, ...rest } = props;

        if (!user || !checkRole(user.role, allowedRoles)) {
            return null;
        }

        return <Component user={user} {...rest} />;
    };
};

/**
 * Utility component for admin-only content
 */
export const AdminOnly = ({ children, user, fallback = null }) => (
    <RoleGuard
        user={user}
        allowedRoles={['ITInfrastructure', 'Admin']}
        fallback={fallback}
    >
        {children}
    </RoleGuard>
);

/**
 * Utility component for reviewer content
 */
export const ReviewerOnly = ({ children, user, fallback = null }) => (
    <RoleGuard
        user={user}
        allowedRoles={[
            'SeniorConsultant',
            'ProjectManager',
            'KnowledgeChampion',
            'KnowledgeGovernanceCouncil',
            'ITInfrastructure'
        ]}
        fallback={fallback}
    >
        {children}
    </RoleGuard>
);

export default RoleGuard;
