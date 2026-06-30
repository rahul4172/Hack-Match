import mongoose from 'mongoose';

const debriefSchema = new mongoose.Schema({
  hackathon_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project_link: { type: String },
  hardest_challenge: { type: String },
  do_differently: { type: String },
  teammate_rating: { type: Number },
  teammate_tags: { type: String },
  hack_again: { type: String },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

debriefSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  }
});

const Debrief = mongoose.model('Debrief', debriefSchema);
export default Debrief;
