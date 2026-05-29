import bcrypt from 'bcryptjs';
import User, { IUser } from '../models/User';
import ACCOUNT_ROLES from '../constants/accountRoleEnums';

async function seedAdmin(): Promise<IUser> {
  const existingAdmin = await User.findOne({ accountRole: ACCOUNT_ROLES.ADMIN }).lean();
  if (existingAdmin) return existingAdmin as unknown as IUser;

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

export default seedAdmin;
