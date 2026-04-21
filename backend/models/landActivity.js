import mongoose from 'mongoose';

const landActivitySchema = new mongoose.Schema(
  {
    land_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Land',
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    activity_type: {
      type: String,
      enum: [
        'LandAdded',
        'EventCreated',
        'DiggingStarted',
        'DiggingCompleted',
        'PlantingStarted',
        'PlantingCompleted',
        'WateringDone',
        'FertilizerApplied',
        'GuardsInstalled',
        'PhotoAdded',
        'StatusUpdated',
        'TreeDied',
        'Maintenance',
      ],
      required: true,
    },
    description: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

landActivitySchema.index({ land_id: 1, created_at: -1 });
landActivitySchema.index({ user_id: 1, created_at: -1 });

const LandActivity = mongoose.model('LandActivity', landActivitySchema);
export default LandActivity;
