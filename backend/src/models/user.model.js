import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId; // Password required only if not OAuth user
      },
      default: null,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    age: {
      type: Number,
      min: 0,
      default: 0,
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      default: 'student',
    },
    
    // OAuth fields
    googleId: {
      type: String,
      sparse: true, // Allows multiple null values
      unique: true,
    },
    profilePic: {
      type: String,
      default: '',
    },
    // Password reset fields
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetCode: {
      type: String,
      default: null,
      minlength: 6,
      maxlength: 6,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    // Email verification
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const User = model('user', userSchema);
export default User;