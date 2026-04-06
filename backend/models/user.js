import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      maxlength: 100,
    },
    password: {
      type: String,
      required: true,
      maxlength: 255,
    },
    role: {
      type: String,
      enum: ['Volunteer', 'Sponsor', 'Organizer', 'Landowner', 'Admin'],
      default: 'Volunteer',
    },
    account_type: {
      type: String,
      enum: ['Individual', 'Organization'],
      default: 'Individual',
    },
    organization_name: {
      type: String,
      maxlength: 150,
    },
    phone: {
      type: String,
      maxlength: 30,
    },
    sponsor_logo_url: {
      type: String,
      maxlength: 500,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    karma_points: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

const User = mongoose.model('User', userSchema);
export default User;
