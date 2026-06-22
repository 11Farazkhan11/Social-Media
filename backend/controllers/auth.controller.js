import User from '../models/User.model.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.utils.js';
import { asyncHandler } from '../middleware/error.middleware.js';

export const register = asyncHandler(async (req, res) => {
  const { username, email, password, fullName } = req.body;

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    const field = existingUser.email === email ? 'Email' : 'Username';
    return res.status(400).json({ success: false, message: `${field} already in use` });
  }

  const user = await User.create({ username, email, password, fullName });
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokens.push(refreshToken);
  await user.save({ validateBeforeSave: false });

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: { user, accessToken, refreshToken },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokens.push(refreshToken);
  if (user.refreshTokens.length > 5) user.refreshTokens.shift(); // Keep only last 5
  await user.save({ validateBeforeSave: false });

  const userObj = user.toJSON();

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    data: { user: userObj, accessToken, refreshToken },
  });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token required' });
  }

  const decoded = verifyRefreshToken(refreshToken);
  const user = await User.findById(decoded.userId);

  if (!user || !user.refreshTokens.includes(refreshToken)) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }

  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
  user.refreshTokens.push(newRefreshToken);
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
  });
});

export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const user = await User.findById(req.user._id);

  if (user && refreshToken) {
    user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
    await user.save({ validateBeforeSave: false });
  }

  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('followers', 'username avatar fullName')
    .populate('following', 'username avatar fullName');
  res.status(200).json({ success: true, data: { user } });
});
