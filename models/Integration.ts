import mongoose from 'mongoose'

const integrationSchema = new mongoose.Schema({
  integration_id: {
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
  type: {
    type: String,
    required: true,
    enum: [
      'filesystem',
      'github',
      'google-drive',
      'slack',
      'database',
      'web-search',
      'email',
      'calendar',
      'jira',
      'notion'
    ]
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  config: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  credentials: {
    type: Map,
    of: String, // Encrypted in production
    default: {}
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  last_used: {
    type: Date,
    default: null
  }
})

// Compound indexes
integrationSchema.index({ user_id: 1, type: 1 })
integrationSchema.index({ user_id: 1, enabled: 1 })

// Update timestamp on save
integrationSchema.pre('save', function(next) {
  this.updated_at = new Date()
  next()
})

const Integration = mongoose.models.Integration || mongoose.model('Integration', integrationSchema)

export default Integration
