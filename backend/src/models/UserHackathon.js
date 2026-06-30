import mongoose from 'mongoose';

const userHackathonSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hackathon_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon', required: true },
}, { timestamps: false });

userHackathonSchema.index({ user_id: 1, hackathon_id: 1 }, { unique: true });

const UserHackathon = mongoose.model('UserHackathon', userHackathonSchema);
export default UserHackathon;
