import mongoose from "mongoose";

const NotificationSettingsSchema = new mongoose.Schema(
  {
    // User these settings belong to
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      unique: true,
      index: true,
    },

    // Notification type preferences
    emailOnApprove: { type: Boolean, default: true },
    emailOnReject: { type: Boolean, default: true },
    emailOnGrade: { type: Boolean, default: true },
    emailOnComment: { type: Boolean, default: true },
    emailOnBackup: { type: Boolean, default: true },
    emailOnSystemEvent: { type: Boolean, default: false },

    // Frequency
    digestFrequency: {
      type: String,
      enum: ["real-time", "daily", "weekly"],
      default: "real-time",
    },

    // Push notifications
    pushEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const NotificationSettings = mongoose.model(
  "notificationSettings",
  NotificationSettingsSchema
);
export default NotificationSettings;
