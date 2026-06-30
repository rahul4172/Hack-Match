import mongoose from 'mongoose';

const hackathonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: String },
  prize_pool: { type: String },
  tech_stack_focus: { type: String },
  team_size: { type: String },
  platform: { type: String, default: 'Devfolio' },
  registration_url: { type: String },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

hackathonSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  }
});

const Hackathon = mongoose.model('Hackathon', hackathonSchema);
export default Hackathon;
