import mongoose from 'mongoose';

const eventResourceSchema = new mongoose.Schema(
  {
    event_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    resource_type: {
      type: String,
      enum: ['Land', 'Saplings', 'Fertilizer', 'TreeGuards', 'Tools', 'Water'],
      required: true,
    },
    required_quantity: {
      type: Number,
      default: 0,
    },
    fulfilled_quantity: {
      type: Number,
      default: 0,
    },
    required_amount: {
      type: Number,
      default: 0,
    },
    fulfilled_amount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'Partial', 'Complete'],
      default: 'Pending',
    },
    fulfilled_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    fulfillment_type: {
      type: String,
      enum: ['Funded', 'Procured'],
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

const EventResource = mongoose.model('EventResource', eventResourceSchema);
export default EventResource;