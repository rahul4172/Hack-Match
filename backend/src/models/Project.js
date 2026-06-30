import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  link: { type: String },
  tags: { type: String, default: '[]' },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

projectSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  }
});

const Project = mongoose.model('Project', projectSchema);
export default Project;
