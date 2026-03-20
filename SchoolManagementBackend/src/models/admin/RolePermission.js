import mongoose from 'mongoose';
const RolePermissionSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: false, // Optional for global super-admins, but required for tenant roles
    },
    permissions: {
      type: [String], // Array of 'resource:action' (e.g., 'users:write', 'roles:read')
      required: false,
      default: [],
    },
  },
  { timestamps: true }
);
const RoleManagement = mongoose.model('RoleManagement', RolePermissionSchema);
export default RoleManagement;
