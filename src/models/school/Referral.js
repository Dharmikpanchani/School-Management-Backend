import mongoose from 'mongoose';

const ReferralSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    number: {
      type: String,
      required: true,
      unique: true,
    },
    upiId: {
      type: String,
      required: false,
    },
    schools: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
      },
    ],
  },
  { timestamps: true }
);

const Referral = mongoose.model('Referral', ReferralSchema);
export default Referral;
