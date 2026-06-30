import mongoose from 'mongoose';

const squadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  hackathon_name: { type: String, required: true },
  join_code: { type: String, required: true, unique: true },
  creator_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

squadSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  }
});

const Squad = mongoose.model('Squad', squadSchema);
export default Squad;
