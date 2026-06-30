import mongoose from 'mongoose';

const stackClashSchema = new mongoose.Schema({
  connection_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Connection', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  challenge_id: { type: String, required: true },
  code: { type: String },
  submitted_at: { type: Date, default: Date.now },
}, { timestamps: false });

stackClashSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  }
});

const StackClash = mongoose.model('StackClash', stackClashSchema);
export default StackClash;
