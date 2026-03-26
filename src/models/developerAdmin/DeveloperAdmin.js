import mongoose from 'mongoose';

const DeveloperSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: false,
    },
    password: {
      type: String,
      required: false,
    },
    phoneNumber: {
      type: String,
      required: false,
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoleManagement',
      required: false,
    },
    name: {
      type: String,
      required: false,
    },
    image: {
      type: String,
      default: null,
    },
    otp: {
      type: Number,
      default: null,
    },
    otpExpireAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isLogin: {
      type: Boolean,
      default: false,
    },
    address: {
      type: String,
      required: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    developerType: {
      type: String,
      enum: ['super_developer', 'developer'],
      default: 'developer',
    },
  },
  { timestamps: true }
);
const DeveloperAdmin = mongoose.model('DeveloperAdmin', DeveloperSchema);
export default DeveloperAdmin;
