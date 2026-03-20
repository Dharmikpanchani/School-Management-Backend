import mongoose from 'mongoose';

const PropertyTypeSchema = new mongoose.Schema(
  {
    square_meters: Number,
    apartments: Number,
    outdoor_indoor: Number,
    isAvatarShow: Boolean,
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
const PropertyType = mongoose.model('PropertyType', PropertyTypeSchema);
export default PropertyType;
