import mongoose from 'mongoose';

const landSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      maxlength: 255,
    },
    address: {
      type: String,
      required: true,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    area_sqft: {
      type: Number,
    },
    land_type: {
      type: String,
      enum: ['Private', 'Public', 'Government', 'School', 'College', 'Community', 'Owned', 'Leased'],
      default: 'Private',
    },
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    soil_type: {
      type: String,
      enum: ['Red', 'Clay', 'Sandy', 'Loamy', 'Black', 'Other', null],
    },
    water_availability: {
      type: Boolean,
      default: false,
    },
    water_source: {
      type: String,
      maxlength: 100,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ['Available', 'Reserved', 'Active', 'Completed'],
      default: 'Available',
    },
    photos: {
      type: [
        {
          url: String,
          caption: String,
          added_at: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    total_trees_planted: {
      type: Number,
      default: 0,
    },
    total_events_hosted: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

const Land = mongoose.model('Land', landSchema);
export default Land;