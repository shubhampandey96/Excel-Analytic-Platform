import { jwtDecode } from 'jwt-decode';
import React from 'react'
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
    const token = localStorage.getItem('token'); // Assuming your JWT is stored as a token in localStorage

    // Scenario 1: No Authentication token found
    if (!token) {
        console.log('No token found, redirecting to login page...');
        return < Navigate to={'/login'} replace />
    }

    try {
        // 2. Decode the Token to get user information (safely on frontend)
        const decodedToken = jwtDecode(token);
        // Backend's authController.js puts 'id' and 'isAdmin' in the token payload
        const { exp, isAdmin } = decodedToken; // 'exp' is the expiration time, 'isAdmin' is for role check

        // 3. Check if the Token is expired
        // 'exp' is in seconds (Unix timestamp), Date.now() is in milliseconds
        if (exp * 1000 < Date.now()) {
            localStorage.removeItem('token'); // Clear expired token
            console.warn('Token expired, redirecting to login page...');
            alert('Your session has expired. Please log in again.'); // Display a message to the user
            return <Navigate to={'/login'} replace />
        }

        // 4. Check for Required Role (if specified)
        // The 'isAdmin' flag from the decoded token is the source of truth for roles.
        if (requiredRole === 'admin' && !isAdmin) {
            // If 'admin' role is required and user is NOT an admin
            console.warn('Access Denied: User is not an admin.');
            alert('Access Denied: You do not have administratiuve privileges.'); // Display a message to the user
            return <Navigate to={'/dashboard'} replace />; // Redirect non-admins trying to access admin dashboard
        }
        // If requiredRole is 'user' or not specified, and user is logged in, allow access
        // Admins can also access 'user' routes, so no specific check needed for 'user' role here.
    } catch (error) {
        // if token is invalid (error.g., malformed, signature mismatch, or jwtDecode fails)
        console.error('Invalid token:', error);
        localStorage.removeItem('token'); // Clear invalid token
        alert('Authentication failed. Please log in again.'); // Display a message to the user
        return <Navigate to={'/login'} replace />
    }

    // Scenario 4: Authentication token exists, is valid, and role matches (if required). Allow access.
    return children;
}

export default ProtectedRoute;