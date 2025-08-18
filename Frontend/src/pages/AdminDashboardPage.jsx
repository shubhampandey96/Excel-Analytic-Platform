// excel-analytics-frontend/src/pages/AdminDashboardPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api'; // Assuming you have a configured axios instance

// Custom Confirmation Modal Component
const ConfirmationModal = ({ show, message, onConfirm, onCancel }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Action</h3>
                <p className="text-sm text-gray-700 text-center mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-300"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};


const AdminDashboardPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [allFiles, setAllFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for confirmation modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [userToDeleteId, setUserToDeleteId] = useState(null);
    const [userToDeleteEmail, setUserToDeleteEmail] = useState('');
    const [deleteMessage, setDeleteMessage] = useState('');


    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const decoded = jwtDecode(token);
            setUser(decoded);

            // Check if the user is an admin
            if (!decoded.isAdmin) {
                navigate('/dashboard'); // Redirect non-admins
                return;
            }

            fetchAdminData(); // Call fetchAdminData directly

        } catch (decodeError) {
            console.error('Failed to decode token:', decodeError);
            localStorage.removeItem('token');
            navigate('/login');
        }
    }, [navigate]);

    // Function to fetch all admin data (users and files)
    const fetchAdminData = async () => {
        setLoading(true);
        setError(null);
        try {
            const usersResponse = await api.get('/admin/users');
            setAllUsers(usersResponse.data.users);

            const filesResponse = await api.get('/admin/files');
            setAllFiles(filesResponse.data.files);

        } catch (err) {
            console.error('Error fetching admin data:', err);
            setError('Failed to fetch admin data. Please check server logs or your network connection.');
            if (err.response && err.response.status === 403) {
                setError('Access Denied: You do not have administrative privileges.');
                setTimeout(() => navigate('/dashboard'), 3000);
            }
        } finally {
            setLoading(false);
        }
    };

    // Handler for showing the confirmation modal before deleting a user
    const confirmDeleteUser = (userId, userEmail) => {
        setUserToDeleteId(userId);
        setUserToDeleteEmail(userEmail);
        setDeleteMessage(`Are you sure you want to delete user "${userEmail}"? This action cannot be undone and will delete all their uploaded files.`);
        setShowConfirmModal(true);
    };

    // Handler for deleting a user after confirmation
    const handleDeleteUser = async () => {
        setShowConfirmModal(false); // Close the modal immediately

        if (!userToDeleteId) return;

        try {
            const response = await api.delete(`/admin/users/${userToDeleteId}`);
            console.log(response.data.message);
            // Refresh data after successful deletion
            await fetchAdminData();
            alert(response.data.message); // Use alert for simple success feedback
        } catch (err) {
            console.error('Error deleting user:', err);
            const errorMessage = err.response?.data?.message || 'Failed to delete user.';
            alert(`Error: ${errorMessage}`); // Use alert for error feedback
        } finally {
            setUserToDeleteId(null);
            setUserToDeleteEmail('');
            setDeleteMessage('');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-gray-600">Loading admin dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-8">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline"> {error}</span>
                <div className="mt-4 text-center">
                    <Link to="/dashboard" className="text-blue-600 hover:underline">Go back to Dashboard</Link>
                </div>
            </div>
        );
    }

    if (!user || !user.isAdmin) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-red-500">Access Denied. Redirecting...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 bg-white rounded-xl shadow-2xl my-8 border border-gray-200">
            {/* Confirmation Modal */}
            <ConfirmationModal
                show={showConfirmModal}
                message={deleteMessage}
                onConfirm={handleDeleteUser}
                onCancel={() => setShowConfirmModal(false)}
            />

            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
                    Admin Dashboard
                </h1>
                <button
                    onClick={() => {
                        localStorage.removeItem('token');
                        navigate('/login');
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-300"
                >
                    Logout
                </button>
            </div>

            <p className="text-lg text-gray-700 mb-6">
                Welcome, <span className="font-semibold">{user.name || user.email || 'Admin'}</span>! Here you can manage users and view all uploaded files.
            </p>

            {/* Navigation back to User Dashboard */}
            <div className="mb-8">
                <Link to="/dashboard" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    &larr; Back to User Dashboard
                </Link>
            </div>

            {/* All Users Section */}
            <section className="mb-10 p-6 border border-gray-300 rounded-lg bg-gray-50">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">All Users</h3>
                {allUsers.length === 0 ? (
                    <p className="text-gray-600">No users found.</p>
                ) : (
                    <div className="rounded-lg border border-gray-200 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered On</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {allUsers.map((userItem) => (
                                    <tr key={userItem._id}><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{userItem._id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{userItem.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{userItem.isAdmin ? 'Admin' : 'User'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{userItem.createdAt ? new Date(userItem.createdAt).toLocaleDateString() : 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {!userItem.isAdmin ? (
                                                <button
                                                    onClick={() => confirmDeleteUser(userItem._id, userItem.email)}
                                                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-300 text-xs"
                                                >
                                                    Delete
                                                </button>
                                                ) : null
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* All Files Section */}
            <section className="p-6 border border-gray-300 rounded-lg bg-gray-50">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">All Uploaded Files</h3>
                {allFiles.length === 0 ? (
                    <p className="text-gray-600">No files uploaded yet.</p>
                ) : (
                    <div className="rounded-lg border border-gray-200 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File ID</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded By (Email)</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MIME Type</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {allFiles.map((fileItem) => (
                                    <tr key={fileItem._id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fileItem._id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fileItem.filename}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fileItem.uploadedBy ? fileItem.uploadedBy.email : 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(fileItem.uploadDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fileItem.fileMimeType}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
};

export default AdminDashboardPage;
