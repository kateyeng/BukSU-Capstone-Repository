import mongoose from "mongoose";

const SupportTicketSchema = new mongoose.Schema(
  {
    // User who reported
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    submittedByEmail: { type: String, trim: true, lowercase: true, required: true },
    submittedByName: { type: String, trim: true, default: "" },

    // Issue details
    category: {
      type: String,
      enum: ["bug", "feature_request", "documentation", "other"],
      default: "other",
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },

    // Context
    page: { type: String, default: "", trim: true },
    browserInfo: { type: String, default: "", trim: true },
    attachments: { type: [String], default: [] },

    // Status
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },

    // Admin response
    adminResponse: { type: String, default: "", trim: true, maxlength: 5000 },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    respondedAt: { type: Date, default: null },

    // Priority
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
  },
  { timestamps: true }
);

SupportTicketSchema.index({ submittedBy: 1, createdAt: -1 });
SupportTicketSchema.index({ status: 1 });
SupportTicketSchema.index({ category: 1 });
SupportTicketSchema.index({ priority: 1 });

const SupportTicket = mongoose.model("supportTicket", SupportTicketSchema);
export default SupportTicket;
