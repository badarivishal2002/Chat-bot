import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: false, // Optional for OAuth users
  },
  emailVerified: {
    type: Date,
    default: null,
  },
  image: {
    type: String,
    default: null,
  },

  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  // Referral system fields - TEMPORARILY DISABLED
  // TODO: Redesign referral system to work properly with sparse indexes
  // Issue: MongoDB sparse indexes work with MISSING fields, not null values
  // Mongoose sets undefined fields to null, causing duplicate key errors
  // Solution: Use UUID defaults or separate collection when re-enabling

  // referralCode: {
  //   type: String,
  //   unique: true,
  //   sparse: true,
  //   default: null,
  // },
  // referredBy: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User',
  //   default: null,
  // },
  // referralCount: {
  //   type: Number,
  //   default: 0,
  // },
}, {
  timestamps: true,
})

// Sparse unique index for referralCode - DISABLED
// userSchema.index({ referralCode: 1 }, { unique: true, sparse: true })

const User = mongoose.models.User || mongoose.model('User', userSchema)

export default User 