const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Transaction = require('../models/Transaction');

exports.getTransaction = catchAsync(async (req, res) => {
  const transaction = await Transaction.findById(req.params.transactionId)
    .populate('listing_id')
    .populate('peeler_id', 'display_name avatar_url reputation_score')
    .populate('buyer_id', 'display_name full_name avatar_url reputation_score')
    .lean();

  if (!transaction) {
    throw new AppError('Transaction not found', 404, 'NOT_FOUND');
  }

  // Only parties or admin can view
  const userId = req.user.user_id;
  const isParty =
    transaction.peeler_id._id.toString() === userId ||
    transaction.buyer_id._id.toString() === userId;
  if (!isParty && req.user.role !== 'SYSTEM_ADMIN') {
    throw new AppError('Access denied', 403, 'FORBIDDEN');
  }

  res.status(200).json({ status: 'success', data: transaction });
});

exports.getMyTransactions = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const userId = req.user.user_id;
  const filter = {
    $or: [{ peeler_id: userId }, { buyer_id: userId }],
  };
  if (status) filter.status = status;

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate('listing_id', 'batch_id grade quantity_kg')
      .populate('peeler_id', 'display_name avatar_url')
      .populate('buyer_id', 'display_name full_name avatar_url')
      .skip(skip)
      .limit(parseInt(limit, 10))
      .sort({ createdAt: -1 })
      .lean(),
    Transaction.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    data: transactions,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    },
  });
});

exports.completeTransaction = catchAsync(async (req, res) => {
  const transaction = await Transaction.findById(req.params.transactionId);
  if (!transaction) {
    throw new AppError('Transaction not found', 404, 'NOT_FOUND');
  }

  const userId = req.user.user_id;
  if (
    transaction.peeler_id.toString() !== userId &&
    transaction.buyer_id.toString() !== userId &&
    req.user.role !== 'SYSTEM_ADMIN'
  ) {
    throw new AppError('Access denied', 403, 'FORBIDDEN');
  }

  if (transaction.status !== 'IN_PROGRESS') {
    throw new AppError('Transaction is not in progress', 400, 'INVALID_STATE');
  }

  transaction.status = 'COMPLETED';
  transaction.completed_at = new Date();
  await transaction.save();

  // Update listing
  const Listing = require('../models/Listing');
  await Listing.findByIdAndUpdate(transaction.listing_id, { status: 'COMPLETED' });

  res.status(200).json({
    status: 'success',
    data: { message: 'Transaction completed', transaction_id: transaction._id },
  });
});