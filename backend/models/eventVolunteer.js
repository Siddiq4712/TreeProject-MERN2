import mongoose from 'mongoose';

const eventVolunteerSchema = new mongoose.Schema(
  {
    event_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contribution_type: {
      type: String,
      enum: ['Labor', 'Capital'],
      required: true,
    },
    role: {
      type: String,
      enum: ['Volunteer', 'Sponsor', 'Organizer'],
      default: 'Volunteer',
    },
    tree_ids: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Tree',
      default: [],
    },
    hard_tasks: {
      type: [String],
      default: [],
    },
    soft_tasks: {
      type: [String],
      default: [],
    },
    resource_type: {
      type: String,
      enum: ['Land', 'Saplings', 'Fertilizer', 'TreeGuards', 'General'],
    },
    procurement_type: {
      type: String,
      enum: ['Fund', 'Procure'],
    },
    contribution_amount: {
      type: Number,
      default: 0,
    },
    contribution_quantity: {
      type: Number,
      default: 0,
    },
    shared_on_social: {
      type: Boolean,
      default: false,
    },
    social_media_link: {
      type: String,
      maxlength: 500,
    },
    karma_earned: {
      type: Number,
      default: 0,
    },
    request_status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
      default: 'PENDING',
    },
    rejection_reason: {
      type: String,
      maxlength: 500,
    },
    requested_at: {
      type: Date,
      default: Date.now,
    },
    responded_at: {
      type: Date,
    },
  },
  {
    timestamps: false,
  }
);

const EventVolunteer = mongoose.model('EventVolunteer', eventVolunteerSchema);
export default EventVolunteer;