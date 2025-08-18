// excel-analytics-frontend/src/pages/RegisterPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Import Link
import authService from "../services/authService";

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user"); // State for role selection
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage(""); // Clear any previous error message

    // Map frontend role string to backend isAdmin boolean
    const isAdmin = role === "admin";

    try {
      const response = await authService.register({
        name: fullName,
        email,
        password,
        isAdmin, // Pass isAdmin as a boolean based on role selection
      });
      setMessage(response.message || "Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000); // Redirect after 2 seconds
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred.";
      setMessage(errorMessage); // Display the error message from authService
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-md p-4 w-full flex justify-center items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600 hover:text-blue-800 transition duration-300">
          Excel Analytics
        </Link>
        <div className="flex space-x-4">
          {/* You can add more links here if needed */}
        </div>
      </nav>

      <div className="flex flex-grow justify-center items-center p-4"> {/* Added p-4 for padding on smaller screens */}
        <div className="shadow-lg relative flex flex-col justify-center px-8 py-4 rounded-lg bg-white max-w-sm w-full md:max-w-md lg:max-w-md">
          <h3 className="font-bold text-center mb-4 whitespace-nowrap">
            Register for <span className="text-blue-600 hover:cursor-pointer" onClick={() => navigate('/')}>Excel Analytics</span>
          </h3>
          <p className="text-sm text-center text-gray-500">
            Join us! Please fill in your details to create an account.
          </p>
          <form onSubmit={handleSubmit} className="space-y-6 ">
            {typeof message === "string" && (
              <p className={`text-center ${message.includes("successful") ? "text-green-500" : "text-red-500"}`}>
                {message}
              </p>
            )}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full Name
              </label>
              <input
                name="fullName"
                type="text"
                id="fullName"
                required
                className="mt-1 block w-full px-4 py-2 border-md shadow-sm rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm border border-gray-300"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                name="email"
                type="email"
                id="email"
                required
                className="mt-1 block w-full px-4 py-2 border-md shadow-sm rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm border border-gray-300"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                name="password"
                type="password"
                id="password"
                required
                className="mt-1 block w-full px-4 py-2 border-md shadow-sm rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm border border-gray-300"
                placeholder="Create your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {/* Role Input field with dropdown */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select name="role" id="role" value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 block w-full px-4 py-2 border-md shadow-sm rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm border border-gray-300">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-md mt-5 w-full py-2 px-4 hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:-translate-y-0.5 hover:shadow-xl" disabled={isLoading}>
              {isLoading ? <i className="bx bx-hourglass bx-spin" /> : "Register"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <button
              className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
              onClick={() => navigate("/login")}
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
