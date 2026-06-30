import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, default: 'pending', enum: ['pending', 'accepted', 'rejected'] },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

connectionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  }
});

const Connection = mongoose.model('Connection', connectionSchema);
export default Connection;
