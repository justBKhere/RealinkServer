import mongoose from 'mongoose';

import { On3AccountDB } from '../services/dbmsHandler';

export interface IUser extends mongoose.Document {
  username: string;
  password: string;
  email?: string;
  profileImage?: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  isTwoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  qrCodeToken?: string;
  qrCodeExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date;
  activeSession: boolean;
}

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  profileImage: {
    type: String,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  isTwoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: String,
  qrCodeToken: String,
  qrCodeExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: Date,
  lastLogin: Date,
  activeSession: {
    type: Boolean,
    default: false,
  },
});

export const User = On3AccountDB.model<IUser>('User', UserSchema);
