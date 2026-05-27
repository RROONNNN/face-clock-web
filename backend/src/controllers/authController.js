const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const throwIfValidationFails = require('../utils/validationResult');
const { generateToken, generateRefreshToken } = require('../utils/generateToken');

function safeUser(user) {
  return {
    id: user._id,
    employeeCode: user.employeeCode,
    name: user.name,
    role: user.accountRole,
  };
}

exports.login = async (req, res) => {
  const invalid = throwIfValidationFails(req, res);
  if (invalid) return invalid;

  const { employeeCode, password } = req.body;
  const user = await User.findOne({ employeeCode });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const accessToken = generateToken(user._id, user.accountRole);
  const { raw: refreshToken, hash: refreshTokenHash } = generateRefreshToken();
  user.refreshTokenHash = refreshTokenHash;
  await user.save();

  return res.json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: safeUser(user),
    },
  });
};

exports.refresh = async (req, res) => {
  const invalid = throwIfValidationFails(req, res);
  if (invalid) return invalid;

  const { refreshToken } = req.body;
  const refreshTokenHash = crypto
    .createHmac('sha256', process.env.REFRESH_TOKEN_SECRET)
    .update(refreshToken)
    .digest('hex');

  const user = await User.findOne({ refreshTokenHash });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }

  const accessToken = generateToken(user._id, user.accountRole);
  return res.json({ success: true, data: { accessToken } });
};

exports.logout = async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { refreshTokenHash: null });
  return res.json({ success: true, message: 'Logged out successfully' });
};
