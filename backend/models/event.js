import mongoose from 'mongoose';

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
    description: {
      type: String,
    },
    location_code: {
      type: String,
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
      maxlength: 255,
    },
    budget: {
      type: Number,
      default: 0,
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
      default: 'Volunteer-Led',
    },
    approval_mode: {
      type: String,
      enum: ['Auto', 'Manual'],
      default: 'Manual',
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
      default: 'NEEDED',
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
      default: false,
    },
    expected_volunteers: {
      type: Number,
      default: 0,
    },
    maintenance_plan: {
      type: String,
      maxlength: 1000,
    },
    community_engagement_strategy: {
      type: String,
      maxlength: 1000,
    },
    media_coverage: {
      type: Boolean,
      default: false,
    },
    social_media_handles: {
      type: [String],
      default: [],
    },
    contact_person: {
      name: String,
      phone: String,
      email: String,
    },
    climate_zone: {
      type: String,
      maxlength: 100,
    },
    suggested_tree_types: {
      type: [String],
      default: [],
    },
    procurement_status: {
      type: String,
      enum: ['PLANNED', 'IN_PROGRESS', 'READY'],
      default: 'PLANNED',
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

const Event = mongoose.model('Event', eventSchema);
export default Event;
