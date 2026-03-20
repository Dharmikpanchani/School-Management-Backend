import mongoose from 'mongoose';
const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: false,
    },
    fullName: {
      type: String,
      required: false,
    },
    image: {
      type: String,
      default: null,
    },
    gender: {
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
    otp: {
      type: Number,
      default: null,
    },
    otpExpireAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    isVerify: {
      type: Boolean,
      default: false,
    },
    // Multi-tenant fields
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: false, // Optional if users can exist without a school, but typically required in SAAS.
    },
    address: {
      type: String,
      required: false,
    },
    schoolName: {
      type: String,
      required: false,
    },
    schoolEmail: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);
const User = mongoose.model('User', UserSchema);
export default User;
