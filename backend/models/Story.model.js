import mongoose from 'mongoose';

const storySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  media: {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], default: 'image' },
  },
  caption: {
    type: String,
    maxlength: [200, 'Story caption cannot exceed 200 characters'],
    default: '',
  },
  viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    index: { expires: 0 },
  },
}, { timestamps: true });

const Story = mongoose.model('Story', storySchema);
export default Story;
