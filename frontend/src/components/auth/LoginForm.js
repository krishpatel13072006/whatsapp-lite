/* eslint-disable */
import React, { useState } from 'react';
import { MessageSquare, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Float, Sparkles, MeshTransmissionMaterial } from '@react-three/drei';

/**
 * Login Form Component
 * Handles user login with username and password
 */
const LoginForm = ({ onLogin, onSwitchToRegister, onForgotPassword, isLoading, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!username.trim() || !password.trim()) {
      setLocalError('Please fill in all fields');
      return;
    }

    // Call onLogin with an event-like object that has preventDefault
    if (onLogin) {
      await onLogin({ preventDefault: () => { } });
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* 3D Animated Background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
          <ambientLight intensity={0.5} />
          <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <mesh>
              <sphereGeometry args={[2, 64, 64]} />
              <MeshTransmissionMaterial
                backside
                backsideThickness={0.5}
                thickness={0.5}
                chromaticAberration={0.5}
                distortion={0.3}
                color="#00a884"
                transmission={0.95}
              />
            </mesh>
          </Float>
          <Sparkles count={100} scale={10} size={2} speed={0.4} color="#00a884" />
        </Canvas>
      </div>

      {/* Animated Grid Overlay */}
      <div className="animated-grid absolute inset-0 z-0" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-[#202c33]/90 backdrop-blur-xl rounded-2xl p-4 sm:p-6 md:p-8 w-full max-w-[95%] sm:max-w-sm md:max-w-md shadow-2xl relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          {/* Animated Logo Container */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            className="relative inline-block mb-3 sm:mb-4"
          >
            {/* Outer glow ring */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#00ff88] via-[#00a884] to-[#00d199]"
              style={{ filter: 'blur(15px)' }}
            />

            {/* Middle glow */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#00a884] to-[#00d199]"
              style={{ filter: 'blur(8px)' }}
            />

            {/* Main icon container */}
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="relative inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-br from-[#00a884] to-[#00d199] rounded-2xl shadow-lg shadow-[#00a884]/50"
            >
              {/* Floating particles inside */}
              <motion.div
                animate={{
                  y: [-5, 5, -5],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <MessageSquare size={28} className="sm:size-36 text-white drop-shadow-lg" />
              </motion.div>

              {/* Sparkle effects */}
              <motion.span
                animate={{
                  scale: [0, 1, 0],
                  x: [-20, -30],
                  y: [-10, -20]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 0.5
                }}
                className="absolute top-1 left-1 text-yellow-300"
              >
                ✨
              </motion.span>
              <motion.span
                animate={{
                  scale: [0, 1, 0],
                  x: [20, 35],
                  y: [10, 15]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 1
                }}
                className="absolute bottom-1 right-1 text-yellow-300"
              >
                ✨
              </motion.span>
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl sm:text-3xl font-bold text-white gradient-text"
          >
            WhatsApp Lite
          </motion.h1>
          <p className="text-gray-400 mt-2 text-sm sm:text-base">Sign in to continue</p>

          {/* About Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-4 p-4 bg-gradient-to-r from-[#1a2a33] to-[#243642] rounded-xl border border-gray-700/30"
          >
            <h3 className="text-[#00a884] font-semibold text-sm mb-2">✨ About WhatsApp Lite</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              A modern, fast, and secure messaging app built with cutting-edge technology.
              Experience seamless chat, voice messages, media sharing, and more - all in a beautiful interface.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs bg-[#00a884]/20 text-[#00a884] px-2 py-1 rounded-full">🚀 Fast</span>
              <span className="text-xs bg-[#00a884]/20 text-[#00a884] px-2 py-1 rounded-full">🔒 Secure</span>
              <span className="text-xs bg-[#00a884]/20 text-[#00a884] px-2 py-1 rounded-full">💬 Modern</span>
            </div>
          </motion.div>
        </div>

        {/* Error Message */}
        {displayError && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-4 backdrop-blur-sm"
          >
            {displayError}
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-400 text-sm mb-2">Username</label>
            <motion.input
              whileFocus={{ scale: 1.02 }}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#2a3942]/80 backdrop-blur-sm text-white px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00a884] border border-gray-700/50 transition-all"
              placeholder="Enter your username"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">Password</label>
            <div className="relative">
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#2a3942]/80 backdrop-blur-sm text-white px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00a884] border border-gray-700/50 pr-12 transition-all"
                placeholder="Enter your password"
                disabled={isLoading}
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </motion.button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#00a884] hover:bg-[#008f72] text-white py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed glow-button"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Forgot Password */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onForgotPassword}
          className="w-full text-[#00a884] hover:underline mt-4 text-sm"
        >
          Forgot password?
        </motion.button>

        {/* Switch to Register */}
        <div className="text-center mt-6 pt-6 border-t border-gray-700">
          <p className="text-gray-400">
            Don't have an account?{' '}
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={onSwitchToRegister}
              className="text-[#00a884] hover:underline font-medium"
            >
              Sign up
            </motion.button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginForm;