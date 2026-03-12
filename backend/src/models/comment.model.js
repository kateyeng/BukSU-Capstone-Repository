import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema(
  {
    // Reference to the project/thesis
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "project",
      required: true,
      index: true,
    },

    // Who commented (teacher/admin)
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    authorName: { type: String, trim: true, default: "" },
    authorEmail: { type: String, trim: true, lowercase: true, default: "" },

    // Comment content
    content: { type: String, required: true, trim: true, maxlength: 10000 },

    // Optional page number or line reference
    page: { type: Number, default: null },
    section: { type: String, trim: true, default: "" },

    // If this is a reply to another comment
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "comment",
      default: null,
    },

    // Comment status (active, resolved, archived)
    status: {
      type: String,
      enum: ["active", "resolved", "archived"],
      default: "active",
    },
  },
  { timestamps: true }
);

CommentSchema.index({ project: 1, createdAt: -1 });
CommentSchema.index({ author: 1 });
CommentSchema.index({ status: 1 });
CommentSchema.index({ replyTo: 1 });

CommentSchema.methods.toJSON = function () {
  const obj = this.toObject({ versionKey: false });
  return obj;
};

const Comment = mongoose.model("comment", CommentSchema);
export default Comment;
