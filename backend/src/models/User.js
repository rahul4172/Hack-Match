import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String },
  bio: { type: String },
  skills: { type: String, default: '[]' },
  winnings: { type: String },
  learnings: { type: String },
  github: { type: String },
  linkedin: { type: String },
  avatar: { type: String },
  public_key: { type: String },
  hack_score: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

// Mongoose adds _id automatically. We'll use the default ObjectId but maybe 
// for compatibility we should add a custom `id` field or just let Mongoose map `id` to `_id.toHexString()`.
// Actually, it's easier to just use standard MongoDB ObjectIds for new apps, but to minimize changes in frontend, 
// let's ensure toJSON transforms `_id` to `id`.
userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  }
});

const User = mongoose.model('User', userSchema);
export default User;
