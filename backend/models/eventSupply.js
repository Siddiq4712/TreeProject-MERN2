import mongoose from 'mongoose';

const eventSupplySchema = new mongoose.Schema(
  {
    event_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    supply_type: {
      type: String,
      enum: ['Saplings', 'Fertilizer', 'TreeGuards', 'Tools', 'Water'],
      required: true,
    },
    quantity_required: {
      type: Number,
      default: 0,
    },
    quantity_received: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'Partial', 'Received'],
      default: 'Pending',
    },
    received_date: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

const EventSupply = mongoose.model('EventSupply', eventSupplySchema);
export default EventSupply;