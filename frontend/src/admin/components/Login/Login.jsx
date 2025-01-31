import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { assets } from '../../assets/assets'; // Import your assets

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    if (/^\d{0,8}$/.test(value)) {
      setUsername(value);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const isPasswordValid = (password) => {
    const minLength = 8;
    const uppercase = /[A-Z]/;
    const number = /[0-9]/;
    const specialChar = /[!@#$%^&*(),.?":{}|<>]/;

    if (password.length < minLength) {
      toast.error('Password must be at least 8 characters long.');
      return false;
    }
    if (!uppercase.test(password)) {
      toast.error('Password must contain at least one uppercase letter.');
      return false;
    }
    if (!number.test(password)) {
      toast.error('Password must contain at least one number.');
      return false;
    }
    if (!specialChar.test(password)) {
      toast.error('Password must contain at least one special character.');
      return false;
    }
    return true;
  };

  const handleLogin = () => {
    if (username.length !== 8) {
      toast.error('Username must be 8 digits!');
      return;
    }
    if (password === '') {
      toast.error('Password cannot be empty!');
      return;
    }
    if (!isPasswordValid(password)) {
      return;
    }

    toast.success('Logged in successfully!');
    setTimeout(() => {
      navigate('/home');
    }, 1500);
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center transition-all duration-500"
      style={{
        backgroundImage: `url(${assets.apsit_bg})`,
        backgroundAttachment: 'fixed',
      }}
    >
      <div
        className="w-full max-w-lg bg-white shadow-xl rounded-lg p-8 transform transition-all duration-700 ease-out animate__animated animate__fadeInUp"
      >
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 animate__animated animate__fadeIn animate__delay-1s">
          Login
        </h1>
        <div className="space-y-6">
          {/* Username Input */}
          <div>
            <label
              htmlFor="username"
              className="block text-lg font-medium text-gray-700"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Enter your username"
              maxLength="8"
              className="mt-2 w-full px-4 py-3 text-lg border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
            />
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              className="block text-lg font-medium text-gray-700"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="mt-2 w-full px-4 py-3 text-lg border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
              />
              <span
                className="absolute inset-y-0 right-3 flex items-center cursor-pointer"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? '🙈' : '👁️'}
              </span>
            </div>
          </div>

          {/* Remember Me and Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="rememberMe"
                className="ml-2 text-lg text-gray-900"
              >
                Remember Me
              </label>
            </div>
            <a
              href="/forgot-password"
              className="text-lg text-blue-600 hover:underline"
            >
              Forgot Password?
            </a>
          </div>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300"
          >
            Login
          </button>
        </div>
      </div>

      {/* Toastify Notifications Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        className="mt-24" // Optional: Add more styles for large text and visibility
      />
    </div>
  );
};

export default Login;
