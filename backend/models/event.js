import mongoose from 'mongoose';

const contactPersonSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    organization: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    event_id: {
      type: String,
      required: true,
      unique: true,
      maxlength: 50,
    },
    location: {
      type: String,
      required: true,
      maxlength: 255,
    },
    pin_code: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10,
    },
    description: {
      type: String,
      required: true,
    },
    location_code: {
      type: String,
      required: true,
      maxlength: 30,
    },
    date_time: {
      type: Date,
      required: true,
    },
    join_deadline: {
      type: Date,
    },
    tree_count: {
      type: Number,
      required: true,
    },
    tree_species: {
      type: String,
      required: true,
      maxlength: 255,
    },
    budget: {
      type: Number,
      required: true,
      min: 0,
    },
    role: {
      type: String,
      enum: ['Volunteer', 'Sponsor'],
      required: true,
    },
    creator_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    land_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Land',
    },
    initiation_type: {
      type: String,
      enum: ['Volunteer-Led', 'Sponsor-Led'],
      required: true,
    },
    approval_mode: {
      type: String,
      enum: ['Auto', 'Manual'],
      required: true,
    },
    labor_goal: {
      type: Number,
      default: 10,
    },
    labor_fulfilled: {
      type: Number,
      default: 0,
    },
    funding_goal: {
      type: Number,
      default: 0,
    },
    funding_fulfilled: {
      type: Number,
      default: 0,
    },
    current_phase: {
      type: String,
      enum: [
        'WAITING_RESOURCES',
        'DIGGING',
        'PLANTING',
        'WATERING',
        'FERTILIZING',
        'GUARDING',
        'MAINTENANCE',
        'COMPLETED',
      ],
      default: 'WAITING_RESOURCES',
    },
    is_ready_to_start: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    banner_url: {
      type: String,
      maxlength: 500,
    },
    land_allocation_status: {
      type: String,
      enum: ['ALLOCATED', 'NEEDED'],
      required: true,
    },
    proposed_land: {
      latitude: Number,
      longitude: Number,
      area_sqft: Number,
      address: String,
    },
    land_support_options: {
      type: [String],
      default: [],
    },
    land_support_other: {
      type: String,
      maxlength: 255,
    },
    can_run_without_sponsorship: {
      type: Boolean,
      required: true,
    },
    expected_volunteers: {
      type: Number,
      required: true,
      min: 0,
    },
    maintenance_plan: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    community_engagement_strategy: {
      type: String,
      maxlength: 1000,
    },
    media_coverage: {
      type: Boolean,
      required: true,
    },
    social_media_handles: {
      type: [String],
      default: [],
    },
    contact_person: {
      type: contactPersonSchema,
      required: true,
    },
    climate_zone: {
      type: String,
      required: true,
      maxlength: 100,
    },
    suggested_tree_types: {
      type: [String],
      default: [],
    },
    procurement_status: {
      type: String,
      enum: ['PLANNED', 'IN_PROGRESS', 'READY'],
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

eventSchema.index({ creator_id: 1, created_at: -1 });
eventSchema.index({ creator_id: 1, is_active: 1, created_at: -1 });
eventSchema.index({ land_id: 1, created_at: -1 });
eventSchema.index({ is_active: 1, created_at: -1 });
eventSchema.index({ current_phase: 1, created_at: -1 });
eventSchema.index({ join_deadline: 1, is_active: 1 });

const Event = mongoose.model('Event', eventSchema);
export default Event;
