import mongoose from 'mongoose';

const plantTrackingSchema = new mongoose.Schema(
  {
    tree_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tree',
      required: true,
    },
    event_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
    },
    land_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Land',
    },
    actor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    action_type: {
      type: String,
      enum: [
        'PLANNED',
        'ASSIGNED',
        'SPONSORED',
        'DIGGING',
        'PLANTING',
        'WATERING',
        'FERTILIZING',
        'GUARDING',
        'HEALTH_UPDATE',
        'HEALTH_AUDIT',
        'HISTORICAL_IMPORT',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 140,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    tracked_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

plantTrackingSchema.index({ tree_id: 1, tracked_at: -1, created_at: -1 });
plantTrackingSchema.index({ event_id: 1, tracked_at: -1 });

const PlantTracking = mongoose.model('PlantTracking', plantTrackingSchema);
export default PlantTracking;
