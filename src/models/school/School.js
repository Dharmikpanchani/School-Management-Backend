import mongoose from 'mongoose';

const SchoolSchema = new mongoose.Schema(
  {
    schoolName: {
      type: String,
      required: true,
    },
    ownerName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    address: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    state: {
      type: String,
      default: '',
    },
    zipCode: {
      type: String,
      default: '',
    },
    country: {
      type: String,
      default: '',
    },
    logo: {
      type: String,
      default: '',
    },
    board: {
      type: String,
      enum: ['CBSE', 'GSEB', 'ICSE', 'Other'],
      required: true,
    },
    schoolType: {
      type: String,
      enum: ['Primary', 'Secondary', 'Higher Secondary'],
      required: true,
    },
    schoolCode: {
      type: String,
      unique: true,
    },
    referralId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Referral',
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Pre-save hook to generate unique school code if not present
SchoolSchema.pre('save', async function (next) {
  if (!this.schoolCode) {
    const code =
      this.schoolName.substring(0, 3).toUpperCase() +
      Math.random().toString(36).substring(2, 6).toUpperCase();
    this.schoolCode = code;
  }
  next();
});

const School = mongoose.model('School', SchoolSchema);
export default School;
