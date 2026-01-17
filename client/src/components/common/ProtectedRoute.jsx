import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute Component
 * Wraps routes that require authentication
 */
const ProtectedRoute = ({ children, user, redirectTo = '/login' }) => {
    if (!user) {
        return <Navigate to={redirectTo} replace />;
    }

    return children;
};

/**
 * HOC version for use without React Router
 */
export const withAuth = (Component) => {
    return function AuthenticatedComponent(props) {
        const { user, ...rest } = props;

        if (!user) {
            return null; // Or redirect component
        }

        return <Component user={user} {...rest} />;
    };
};

export default ProtectedRoute;
