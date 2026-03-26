require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const readline = require('readline');
const { MONGODB_URI, ADMIN_TOTP_ISSUER } = require('../config/env');

const User = require('../models/User');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{12,}$/;

const run = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const force = process.argv.includes('--force');
    const existingAdmin = await User.findOne({ role: 'SYSTEM_ADMIN' });

    if (existingAdmin && !force) {
      console.log('⚠️  SYSTEM_ADMIN already exists. Use --force to overwrite.');
      process.exit(0);
    }

    const username = await ask('Enter admin username: ');
    if (!username || username.trim().length < 3) {
      console.error('Username must be at least 3 characters.');
      process.exit(1);
    }

    const password = await ask('Enter admin password (min 12 chars, upper+lower+number+special): ');
    if (!PASSWORD_REGEX.test(password)) {
      console.error(
        'Password must be at least 12 characters with uppercase, lowercase, number, and special character.'
      );
      process.exit(1);
    }

    const password_hash = await bcrypt.hash(password, 12);

    const secret = speakeasy.generateSecret({
      name: `${ADMIN_TOTP_ISSUER} (${username.trim()})`,
      issuer: ADMIN_TOTP_ISSUER,
    });

    if (existingAdmin && force) {
      await User.deleteOne({ _id: existingAdmin._id });
    }

    await User.create({
      username: username.trim(),
      password_hash,
      totp_secret: secret.base32,
      role: 'SYSTEM_ADMIN',
      status: 'ACTIVE',
      auth_method: 'TOTP_PASSPHRASE',
      display_name: 'System Administrator',
    });

    console.log(`\n✅ Admin created: ${username.trim()}`);
    console.log(`📱 Scan this QR in Google Authenticator:\n`);

    const qrString = await qrcode.toString(secret.otpauth_url, { type: 'terminal', small: true });
    console.log(qrString);

    console.log(`\n🔗 OTP Auth URL: ${secret.otpauth_url}`);
    console.log(`🔑 TOTP secret (backup): ${secret.base32}`);
    console.log(`\n⚠️  Save the TOTP secret securely. It cannot be recovered.\n`);
  } catch (err) {
    console.error('Seed failed:', err.message);
  } finally {
    rl.close();
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();