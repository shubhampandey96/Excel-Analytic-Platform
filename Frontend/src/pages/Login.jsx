// excel-analytics-frontend/src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Import Link
import authService from "../services/authService";

// LoginPage Component
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(""); // State for error message
  const [isLoading, setIsLoading] = useState(false); // State for loading indicator
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage(""); // Clear any previous error message

    try {
      const response = await authService.login({ email, password });
      // Assuming the token is stored by authService.login
      setMessage(response.message || "Login successful! Redirecting to dashboard..."); // Display the success message
      setTimeout(() => {
        navigate("/dashboard"); // Redirect to dashboard on successful login
      }, 1000); // Redirect after 1 second
    } catch (error) {
      console.error("Login error object:", error); // Log the full error object
      // Try to get a more specific message from Axios error structure
      const errorMessage = error.response?.data?.message || error.message || "An unexpected error occurred.";
      setMessage(errorMessage); // Display the error message
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
          <h2 className="font-bold text-center mb-4 whitespace-nowrap">
            Login to <span className="text-blue-600">Excel Analytics</span>
          </h2>
          <p className="text-sm text-center text-gray-500">
            Welcome back! Please enter your credentials to access your dashboard.
          </p>
          <form onSubmit={handleSubmit} className="space-y-6 ">
            {typeof message === "string" && (
              <p className={`text-center ${message.includes("successful") ? "text-green-500" : "text-red-500"}`}>
                {message}
              </p>
            )}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
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
                type="password"
                id="password"
                name="password"
                required
                className="mt-1 block w-full px-4 py-2 border-md shadow-sm rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm border border-gray-300"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" disabled={isLoading} className="disabled:opacity-50 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-md mt-5 w-full py-2 px-4 hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:-translate-y-0.5 hover:shadow-xl">
              {isLoading ? <i className="bx bx-hourglass bx-spin"/> : "Login"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <button
              className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
              onClick={() => navigate("/register")}
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

