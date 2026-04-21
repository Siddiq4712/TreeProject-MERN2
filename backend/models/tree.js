import mongoose from 'mongoose';

const treeSchema = new mongoose.Schema(
  {
    tree_id: {
      type: String,
      required: true,
      unique: true,
      maxlength: 50,
    },
    species: {
      type: String,
      required: true,
      maxlength: 100,
    },
    event_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
    },
    land_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Land',
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    spot_label: {
      type: String,
      maxlength: 100,
    },
    sponsor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    planted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    planted_date: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Planned', 'Hole-Dug', 'Planted', 'Watered', 'Fertilized', 'Guarded', 'Growing', 'Mature', 'Dead'],
      default: 'Planned',
    },
    growth_status: {
      type: String,
      enum: ['Seedling', 'Sapling', 'Young', 'Mature'],
      default: 'Seedling',
    },
    survival_status: {
      type: String,
      enum: ['Healthy', 'Weak', 'Critical', 'Dead'],
      default: 'Healthy',
    },
    height_cm: {
      type: Number,
      default: 0,
    },
    last_watered: {
      type: Date,
    },
    last_fertilized: {
      type: Date,
    },
    maintenance_due_at: {
      type: Date,
    },
    has_tree_guard: {
      type: Boolean,
      default: false,
    },
    is_historical: {
      type: Boolean,
      default: false,
    },
    historical_planted_date: {
      type: Date,
    },
    photo_url: {
      type: String,
      maxlength: 500,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

treeSchema.index({ planted_by: 1, created_at: -1 });
treeSchema.index({ sponsor_id: 1, created_at: -1 });
treeSchema.index({ status: 1, created_at: -1 });
treeSchema.index({ survival_status: 1, created_at: -1 });
treeSchema.index({ event_id: 1, created_at: -1 });
treeSchema.index({ land_id: 1, created_at: -1 });
treeSchema.index({ is_historical: 1, planted_by: 1, created_at: -1 });

const Tree = mongoose.model('Tree', treeSchema);
export default Tree;
