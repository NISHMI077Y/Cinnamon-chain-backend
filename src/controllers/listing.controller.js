const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Listing = require('../models/Listing');
const { generateBatchId } = require('../utils/batchId');

exports.createListing = catchAsync(async (req, res) => {
  const { grade, quantity_kg, price_min, price_max, harvest_date, description } = req.body;

  const image_urls = (req.files || []).map((f) => f.location);

  if (image_urls.length === 0) {
    throw new AppError('At least one image is required', 400, 'VALIDATION_ERROR');
  }

  const batch_id = generateBatchId();

  const listing = await Listing.create({
    peeler_id: req.user.user_id,
    batch_id,
    grade,
    quantity_kg,
    price_min,
    price_max,
    harvest_date,
    description,
    image_urls,
    status: 'DRAFT',
  });

  res.status(201).json({
    status: 'success',
    data: {
      listing_id: listing._id,
      batch_id: listing.batch_id,
      status: listing.status,
    },
  });
});

exports.publishListing = catchAsync(async (req, res) => {
  const listing = await Listing.findById(req.params.listingId);
  if (!listing) {
    throw new AppError('Listing not found', 404, 'NOT_FOUND');
  }
  if (listing.peeler_id.toString() !== req.user.user_id) {
    throw new AppError('You do not own this listing', 403, 'FORBIDDEN');
  }
  if (!['DRAFT', 'VERIFIED'].includes(listing.status) && listing.lab_status !== 'VERIFIED') {
    if (listing.status !== 'DRAFT') {
      throw new AppError('Listing cannot be published from current state', 400, 'INVALID_STATE');
    }
  }

  // Ensure required fields
  if (!listing.quantity_kg || !listing.price_min || !listing.price_max) {
    throw new AppError('Listing is missing required fields', 400, 'VALIDATION_ERROR');
  }

  listing.status = 'PUBLISHED';
  await listing.save();

  res.status(200).json({
    status: 'success',
    data: {
      listing_id: listing._id,
      status: listing.status,
      is_lab_verified: listing.is_lab_verified,
    },
  });
});

exports.getListing = catchAsync(async (req, res) => {
  const listing = await Listing.findById(req.params.listingId)
    .populate('peeler_id', 'display_name avatar_url reputation_score')
    .lean();

  if (!listing) {
    throw new AppError('Listing not found', 404, 'NOT_FOUND');
  }

  res.status(200).json({ status: 'success', data: listing });
});

exports.getListings = catchAsync(async (req, res) => {
  const { status, grade, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (grade) filter.grade = grade;

  // Non-admin users only see published listings
  if (!req.user || req.user.role !== 'SYSTEM_ADMIN') {
    filter.status = 'PUBLISHED';
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const [listings, total] = await Promise.all([
    Listing.find(filter)
      .populate('peeler_id', 'display_name avatar_url reputation_score')
      .skip(skip)
      .limit(parseInt(limit, 10))
      .sort({ createdAt: -1 })
      .lean(),
    Listing.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    data: listings,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    },
  });
});

exports.getMyListings = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const filter = { peeler_id: req.user.user_id };

  const [listings, total] = await Promise.all([
    Listing.find(filter)
      .skip(skip)
      .limit(parseInt(limit, 10))
      .sort({ createdAt: -1 })
      .lean(),
    Listing.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    data: listings,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    },
  });
});