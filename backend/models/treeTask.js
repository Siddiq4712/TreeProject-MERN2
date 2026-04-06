import mongoose from 'mongoose';

const treeTaskSchema = new mongoose.Schema(
  {
    tree_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tree',
      required: true,
    },
    task_type: {
      type: String,
      enum: ['Digging', 'Planting', 'Watering', 'Fertilizing', 'TreeGuard'],
      required: true,
    },
    volunteer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    completed_at: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: false,
  }
);

const TreeTask = mongoose.model('TreeTask', treeTaskSchema);
export default TreeTask;