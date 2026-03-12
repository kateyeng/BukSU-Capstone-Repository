import mongoose from "mongoose";

const rbacSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "main",
    },
    grants: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },
  },
  { timestamps: true }
);

const RbacConfig = mongoose.model("RbacConfig", rbacSchema);

export default RbacConfig;