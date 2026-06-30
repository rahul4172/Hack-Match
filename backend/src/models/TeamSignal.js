import mongoose from 'mongoose';

const teamSignalSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  role_needed: { type: String, required: true },
  expires_at: { type: Date, required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

teamSignalSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  }
});

const TeamSignal = mongoose.model('TeamSignal', teamSignalSchema);
export default TeamSignal;
