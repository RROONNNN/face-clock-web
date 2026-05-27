const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ACCOUNT_ROLES = require('../constants/accountRoleEnums');

async function seedAdmin() {
  const existingAdmin = await User.findOne({ accountRole: ACCOUNT_ROLES.ADMIN }).lean();
  if (existingAdmin) return existingAdmin;

  const employeeCode = process.env.ADMIN_EMPLOYEE_CODE || 'ADMIN';
  const rawPassword = process.env.ADMIN_DEFAULT_PASSWORD || employeeCode;
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const admin = await User.create({
    employeeCode,
    name: 'Administrator',
    accountRole: ACCOUNT_ROLES.ADMIN,
    passwordHash,
  });

  return admin;
}

module.exports = seedAdmin;
