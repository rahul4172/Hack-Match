import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: 'c:\\Users\\rahul\\Desktop\\HackMatch\\backend\\.env' });

const messageSchema = new mongoose.Schema({
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: { type: String }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

const Message = mongoose.model('Message', messageSchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const msgs = await Message.find().sort({ created_at: -1 }).limit(3);
  console.log("LAST 3 MESSAGES:");
  for (const msg of msgs) {
    console.log("-------------------");
    console.log(msg.content);
  }
  mongoose.disconnect();
}
run();
