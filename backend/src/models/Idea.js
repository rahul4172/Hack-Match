import mongoose from 'mongoose';

const ideaSchema = new mongoose.Schema({
  creator_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  pitch: { type: String, required: true },
  roles_needed: { type: String, required: true },
  status: { type: String, default: 'active' },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

ideaSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  }
});

const Idea = mongoose.model('Idea', ideaSchema);
export default Idea;
