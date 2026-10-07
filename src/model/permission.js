import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    lable: {
      type: String,
      required: true,
      trim: true,
    },
    module: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      deafult: "",
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

permissionSchema.index({ module: 1, key: 1 });

const Permission = mongoose.model("Permission", permissionSchema);
export default Permission;
