const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    google_id: { type: String, unique: true, sparse: true },
    email: { type: String, lowercase: true, trim: true, sparse: true },
    display_name: { type: String, trim: true },
    full_name: { type: String, trim: true },
    avatar_url: { type: String },
    phone_number: { type: String, unique: true, sparse: true },
    username: { type: String, unique: true, sparse: true, trim: true },
    password_hash: { type: String, select: false },
    totp_secret: { type: String, select: false },
    national_id_hash: { type: String, select: false },
    role: {
      type: String,
      enum: ['PEELER', 'PLANTATION_OWNER', 'BUYER', 'LAB_TECHNICIAN', 'SYSTEM_ADMIN'],
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
    },
    auth_method: {
      type: String,
      enum: ['GOOGLE', 'PHONE_OTP', 'TOTP_PASSPHRASE'],
    },
    is_available: { type: Boolean, default: true },
    reputation_score: { type: Number, default: 0, min: 0, max: 5 },
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [lng, lat]
      },
    },
    last_login_at: { type: Date },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

userSchema.index({ location: '2dsphere' });
userSchema.index({ role: 1, status: 1 });

module.exports = mongoose.model('User', userSchema);