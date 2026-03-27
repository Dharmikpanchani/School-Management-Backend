import mongoose from 'mongoose';
const AdminSchema = new mongoose.Schema(
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
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: false, // Optional for global admins
    },
    address: {
      type: String,
      required: false,
    },
    isVerified: {
      type: Boolean,
      default: false, // Must verify OTP to become active
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isSuperAdmin: {
      type: Boolean,
      default: false,
    },
    isLogin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
const SchoolAdmin = mongoose.model('SchoolAdmin', AdminSchema);
export default SchoolAdmin;
