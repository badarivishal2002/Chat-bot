import mongoose from 'mongoose'

const projectSchema = new mongoose.Schema({
  project_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user_id: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'investing',
      'homework',
      'writing',
      'health',
      'travel',
      'creative',
      'work',
      'analytics',
      'custom'
    ],
    default: 'custom'
  },
  customCategory: {
    type: String,
    default: null,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  chat_ids: {
    type: [String],
    default: []
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Compound index for efficient user-based queries
projectSchema.index({ user_id: 1, project_id: 1 })
projectSchema.index({ user_id: 1, created_at: -1 })

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema)

export default Project
