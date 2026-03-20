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
        schoolId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'School',
        },
        schoolName: String,
        schoolEmailId: String,
        schoolPhoneNumber: String,
        isPaid: {
          type: Boolean,
          default: false,
        },
        registeredAt: {
          type: Date,
          default: Date.now,
        }
      }
    ]
  },
  { timestamps: true }
);

const Referral = mongoose.model('Referral', ReferralSchema);
export default Referral;
