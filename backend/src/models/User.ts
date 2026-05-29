import mongoose, { Document, Model, Schema } from 'mongoose';
import ACCOUNT_ROLES, { AccountRole } from '../constants/accountRoleEnums';

export interface IAttachment {
  filePath: string;
  fileType?: string;
  uploadedAt?: Date;
}

export interface IUser extends Document {
  employeeCode: string;
  name: string;
  passwordHash: string;
  refreshTokenHash: string | null;
  accountRole: AccountRole;
  jobTitle?: string;
  department?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: Date | null;
  attachments: IAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    employeeCode: {
      type: String,
      unique: true,
      trim: true,
      maxlength: 8,
    },
    name: {
      type: String,
      required: [true, 'Vui lòng nhập tên'],
      trim: true,
      maxlength: 100,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    refreshTokenHash: {
      type: String,
      default: null,
    },
    accountRole: {
      type: String,
      enum: Object.values(ACCOUNT_ROLES),
      default: ACCOUNT_ROLES.EMPLOYEE,
    },
    jobTitle: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    department: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 150,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    attachments: [
      {
        filePath: { type: String, required: true },
        fileType: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

// Auto-generate employeeCode in format "EMP00001" before saving
userSchema.pre('save', async function (next) {
  if (this.employeeCode) return next();

  const UserModel = this.constructor as Model<IUser>;
  const last = await UserModel
    .findOne({ employeeCode: /^EMP\d{5}$/ })
    .sort({ employeeCode: -1 })
    .lean();

  let nextNumber = 1;
  if (last) {
    nextNumber = parseInt(last.employeeCode.replace('EMP', ''), 10) + 1;
  }

  this.employeeCode = 'EMP' + String(nextNumber).padStart(5, '0');
  next();
});

const User = mongoose.model<IUser>('User', userSchema);

export default User;
