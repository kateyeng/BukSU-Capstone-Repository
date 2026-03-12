import { Schema, model } from "mongoose";

const userActivitySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "user", default: null },

    action: {
      type: String,
      enum: [
        "login",
        "logout",
        "login_failed",
        "view_details",
        "download_pdf",

        // ✅ NEW: track more actions
        "upload_project",
        "delete_project",
        "revise_project",
        "backup_create",
        "backup_restore",
        "backup_delete",
        "role_modified",
        "grade_project",
        "bulk_approve_projects",
        "bulk_reject_projects",
      ],
      required: true,
    },

    // snapshot fields
    fullName: { type: String, default: "" },
    email: { type: String, default: "" },
    role: { type: String, default: "" },

    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },

    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default model("userActivity", userActivitySchema);
