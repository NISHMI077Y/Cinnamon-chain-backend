const crypto = require('crypto');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Listing = require('../models/Listing');
const blockchainService = require('../services/blockchain.service');
const labService = require('../services/lab.service');
const logger = require('../config/logger');
const { LAB_ADDRESS } = require('../config/env');

exports.requestLabTest = catchAsync(async (req, res) => {
  const listing = await Listing.findById(req.params.listingId);
  if (!listing) {
    throw new AppError('Listing not found', 404, 'NOT_FOUND');
  }
  if (listing.peeler_id.toString() !== req.user.user_id) {
    throw new AppError('You do not own this listing', 403, 'FORBIDDEN');
  }
  if (listing.status !== 'DRAFT') {
    throw new AppError('Only draft listings can request lab testing', 400, 'INVALID_STATE');
  }

  listing.lab_status = 'SAMPLE_REQUESTED';
  await listing.save();

  res.status(200).json({
    status: 'success',
    data: {
      message: 'Lab test requested. Send 100g sample.',
      lab_address: LAB_ADDRESS,
    },
  });
});

exports.submitResults = catchAsync(async (req, res) => {
  const listing = await Listing.findById(req.params.listingId);
  if (!listing) {
    throw new AppError('Listing not found', 404, 'NOT_FOUND');
  }

  const { coumarin_level, moisture_content, oil_content, cinnamaldehyde_percent } = req.body;

  // Parse numeric values from form data
  const labData = {
    coumarin_level: parseFloat(coumarin_level),
    moisture_content: parseFloat(moisture_content),
    oil_content: parseFloat(oil_content),
    cinnamaldehyde_percent: parseFloat(cinnamaldehyde_percent),
  };

  // Validate numbers
  for (const [key, val] of Object.entries(labData)) {
    if (isNaN(val) || val < 0) {
      throw new AppError(`Invalid value for ${key}`, 400, 'VALIDATION_ERROR');
    }
  }

  // Get uploaded PDF URL
  if (!req.file || !req.file.location) {
    throw new AppError('PDF report is required', 400, 'VALIDATION_ERROR');
  }
  const pdf_s3_url = req.file.location;

  // Create hash of lab data
  const tested_at = new Date().toISOString();
  const dataString = JSON.stringify({
    listing_id: listing._id.toString(),
    coumarin_level: labData.coumarin_level,
    moisture_content: labData.moisture_content,
    oil_content: labData.oil_content,
    cinnamaldehyde_percent: labData.cinnamaldehyde_percent,
    tested_at,
  });
  const sha256Hash = crypto.createHash('sha256').update(dataString).digest('hex');

  // Store on blockchain
  let tx_hash;
  try {
    tx_hash = await blockchainService.storeHash(sha256Hash);
  } catch (err) {
    // Blockchain failed — revert, don't partially save
    logger.error('Blockchain store failed for lab results', {
      listingId: listing._id,
      error: err.message,
    });
    throw err;
  }

  // Calculate grade
  const gradeResult = labService.processLabResults(labData);

  // Update listing
  listing.lab_status = 'VERIFIED';
  listing.lab_data = { ...labData, tested_at: new Date(tested_at) };
  listing.pdf_report_url = pdf_s3_url;
  listing.sha256_hash = sha256Hash;
  listing.blockchain_tx_hash = tx_hash;
  listing.grade = gradeResult.grade;
  listing.suggested_price_per_kg = gradeResult.market_rate_per_kg;
  listing.is_lab_verified = true;
  listing.tested_by = req.user.user_id;
  await listing.save();

  logger.info('Lab results submitted and stored on blockchain', {
    listingId: listing._id,
    txHash: tx_hash,
    grade: gradeResult.grade,
  });

  res.status(200).json({
    status: 'success',
    data: {
      grade: gradeResult.grade,
      market_rate_per_kg: gradeResult.market_rate_per_kg,
      blockchain_tx_hash: tx_hash,
      sha256_hash: sha256Hash,
    },
  });
});

exports.verifyBlockchainHash = catchAsync(async (req, res) => {
  const listing = await Listing.findById(req.params.listingId).lean();
  if (!listing) {
    throw new AppError('Listing not found', 404, 'NOT_FOUND');
  }
  if (!listing.sha256_hash) {
    throw new AppError('No lab data hash found for this listing', 400, 'NO_HASH');
  }

  const isValid = await blockchainService.verifyHash(listing.sha256_hash);

  res.status(200).json({
    status: 'success',
    data: {
      listing_id: listing._id,
      sha256_hash: listing.sha256_hash,
      blockchain_tx_hash: listing.blockchain_tx_hash,
      is_verified_on_chain: isValid,
    },
  });
});