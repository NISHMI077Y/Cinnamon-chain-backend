const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Bid = require('../models/Bid');
const Listing = require('../models/Listing');
const Transaction = require('../models/Transaction');
const BuyerAction = require('../models/BuyerAction');
const notificationService = require('../services/notification.service');

exports.placeBid = catchAsync(async (req, res) => {
  const { listing_id, amount } = req.body;

  const listing = await Listing.findById(listing_id);
  if (!listing) {
    throw new AppError('Listing not found', 404, 'NOT_FOUND');
  }
  if (listing.status !== 'PUBLISHED') {
    throw new AppError('This listing is not accepting bids', 400, 'LISTING_NOT_ACTIVE');
  }

  const existingBid = await Bid.findOne({
    buyer_id: req.user.user_id,
    listing_id,
    status: { $in: ['PENDING', 'ACCEPTED'] },
  });
  if (existingBid) {
    throw new AppError('You have already placed a bid on this listing', 409, 'BID_DUPLICATE');
  }

  const bid = await Bid.create({
    buyer_id: req.user.user_id,
    listing_id,
    amount,
    status: 'PENDING',
    is_sealed: true,
  });

  await BuyerAction.create({
    buyer_id: req.user.user_id,
    action_type: 'BID_PLACED',
    listing_id,
  });

  notificationService.emitToPeeler(listing.peeler_id.toString(), 'NEW_BID', {
    bid_id: bid._id,
    listing_id,
    amount,
  });

  res.status(201).json({
    status: 'success',
    data: {
      bid_id: bid._id,
      status: bid.status,
      message: 'Bid placed successfully',
    },
  });
});

exports.acceptBid = catchAsync(async (req, res) => {
  const bid = await Bid.findById(req.params.bidId);
  if (!bid) {
    throw new AppError('Bid not found', 404, 'NOT_FOUND');
  }

  const listing = await Listing.findById(bid.listing_id);
  if (!listing) {
    throw new AppError('Listing not found', 404, 'NOT_FOUND');
  }
  if (listing.peeler_id.toString() !== req.user.user_id) {
    throw new AppError('You do not own this listing', 403, 'FORBIDDEN');
  }
  if (bid.status !== 'PENDING') {
    throw new AppError('Bid is no longer pending', 400, 'INVALID_STATE');
  }
  if (listing.status !== 'PUBLISHED') {
    throw new AppError('Listing is not in a valid state for accepting bids', 400, 'INVALID_STATE');
  }

  // Accept this bid
  bid.status = 'ACCEPTED';
  await bid.save();

  // Reject all other pending bids
  await Bid.updateMany(
    { listing_id: listing._id, status: 'PENDING', _id: { $ne: bid._id } },
    { status: 'REJECTED' }
  );

  // Update listing
  listing.status = 'IN_PROGRESS';
  await listing.save();

  // Create transaction
  const transaction = await Transaction.create({
    listing_id: listing._id,
    peeler_id: listing.peeler_id,
    buyer_id: bid.buyer_id,
    bid_id: bid._id,
    status: 'IN_PROGRESS',
  });

  // Notify buyer
  notificationService.emitToBuyer(bid.buyer_id.toString(), 'BID_ACCEPTED', {
    bid_id: bid._id,
    listing_id: listing._id,
    transaction_id: transaction._id,
  });

  // Notify rejected bidders
  const rejectedBids = await Bid.find({
    listing_id: listing._id,
    status: 'REJECTED',
  }).lean();
  for (const rb of rejectedBids) {
    notificationService.emitToBuyer(rb.buyer_id.toString(), 'BID_REJECTED', {
      bid_id: rb._id,
      listing_id: listing._id,
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      transaction_id: transaction._id,
      status: transaction.status,
    },
  });
});

exports.getMyBids = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const filter = { buyer_id: req.user.user_id };

  const [bids, total] = await Promise.all([
    Bid.find(filter)
      .populate('listing_id', 'batch_id grade quantity_kg status')
      .skip(skip)
      .limit(parseInt(limit, 10))
      .sort({ createdAt: -1 })
      .lean(),
    Bid.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    data: bids,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    },
  });
});