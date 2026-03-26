const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const User = require('../models/User');
const JobAssignment = require('../models/JobAssignment');
const peelerService = require('../services/peeler.service');
const notificationService = require('../services/notification.service');

exports.getNearbyPeelers = catchAsync(async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radius = parseInt(req.query.radius, 10) || 10000;

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new AppError('Invalid location parameters', 422, 'INVALID_COORDINATES');
  }
  if (radius < 1000 || radius > 50000) {
    throw new AppError('radius must be between 1000 and 50000 metres', 422, 'INVALID_COORDINATES');
  }

  const peelers = await peelerService.findNearbyPeelers(lat, lng, radius);

  res.status(200).json({
    status: 'success',
    data: {
      peelers,
      count: peelers.length,
      ...(peelers.length === 0 && { message: 'No peelers found nearby' }),
    },
  });
});

exports.hirePeeler = catchAsync(async (req, res) => {
  const { peelerId } = req.params;
  const { job_description, location, scheduled_date } = req.body;

  const peeler = await User.findById(peelerId);
  if (!peeler || peeler.role !== 'PEELER') {
    throw new AppError('Peeler not found', 404, 'NOT_FOUND');
  }
  if (peeler.status !== 'ACTIVE') {
    throw new AppError('Peeler account is not active', 400, 'ACCOUNT_SUSPENDED');
  }
  if (!peeler.is_available) {
    throw new AppError('Peeler is no longer available', 409, 'PEELER_UNAVAILABLE');
  }

  const job = await JobAssignment.create({
    owner_id: req.user.user_id,
    peeler_id: peelerId,
    status: 'OFFERED',
    job_description,
    location: {
      type: 'Point',
      coordinates: [location.lng, location.lat],
    },
    scheduled_date,
  });

  notificationService.emitToPeeler(peelerId, 'JOB_OFFER', {
    job_id: job._id,
    owner_name: req.user.display_name || 'Plantation Owner',
    location,
    scheduled_date,
  });

  res.status(201).json({
    status: 'success',
    data: {
      job_id: job._id,
      status: job.status,
    },
  });
});