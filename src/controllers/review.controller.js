const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Transaction = require('../models/Transaction');
const Review = require('../models/Review');
const User = require('../models/User');
const BuyerAction = require('../models/BuyerAction');

exports.createReview = catchAsync(async (req, res) => {
  const { transactionId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.user_id;

  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    throw new AppError('Transaction not found', 404, 'NOT_FOUND');
  }

  if (transaction.status !== 'COMPLETED') {
    throw new AppError('Cannot review an incomplete transaction', 400, 'TRANSACTION_NOT_COMPLETE');
  }

  const peelerId = transaction.peeler_id.toString();
  const buyerId = transaction.buyer_id.toString();

  if (userId !== peelerId && userId !== buyerId) {
    throw new AppError('You are not a party to this transaction', 403, 'FORBIDDEN');
  }

  // Determine roles
  let reviewer_role, reviewee_id;
  if (userId === peelerId) {
    reviewer_role = 'PEELER';
    reviewee_id = buyerId;
  } else {
    reviewer_role = 'BUYER';
    reviewee_id = peelerId;
  }

  // Check duplicate
  const existing = await Review.findOne({ transaction_id: transactionId, reviewer_id: userId });
  if (existing) {
    throw new AppError('You have already submitted a review', 409, 'REVIEW_DUPLICATE');
  }

  const review = await Review.create({
    transaction_id: transactionId,
    reviewer_id: userId,
    reviewee_id,
    reviewer_role,
    rating,
    comment,
  });

  // Recalculate reputation
  const reviews = await Review.find({ reviewee_id }).lean();
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const newReputation = Math.round(avgRating * 10) / 10;

  await User.findByIdAndUpdate(reviewee_id, { reputation_score: newReputation });

  // Log buyer action
  if (reviewer_role === 'BUYER') {
    await BuyerAction.create({
      buyer_id: userId,
      action_type: 'REVIEW_SUBMITTED',
      transaction_id: transactionId,
    });
  }

  res.status(201).json({
    status: 'success',
    data: {
      review_id: review._id,
      new_reputation_score: newReputation,
    },
  });
});