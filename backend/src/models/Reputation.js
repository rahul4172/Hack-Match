import mongoose from 'mongoose';

const reputationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score_component: { type: String },
  points: { type: Number },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

reputationSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  }
});

const Reputation = mongoose.model('Reputation', reputationSchema);
export default Reputation;
