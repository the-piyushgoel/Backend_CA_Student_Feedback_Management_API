const mongoose = require('mongoose');
const Feedback = require('../models/Feedback');

const createFeedback = async (req, res, next) => {
  try {
    const { studentName, courseName, message, rating } = req.body;

    if (!studentName || !courseName || !message || rating === undefined || rating === null || rating === '') {
      return res.status(400).json({
        success: false,
        message: 'studentName, courseName, message and rating are required'
      });
    }

    const numericRating = Number(rating);

    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'rating must be a number between 1 and 5'
      });
    }

    const feedback = await Feedback.create({
      studentName,
      courseName,
      message,
      rating: numericRating
    });

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (error) {
    next(error);
  }
};

const getFeedbacks = async (req, res, next) => {
  try {
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);

    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) {
      return res.status(400).json({
        success: false,
        message: 'page and limit must be positive integers'
      });
    }

    const skip = (page - 1) * limit;

    const [feedbacks, totalRecords] = await Promise.all([
      Feedback.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Feedback.countDocuments()
    ]);

    return res.status(200).json({
      success: true,
      currentPage: page,
      totalRecords,
      feedbacks
    });
  } catch (error) {
    next(error);
  }
};

const updateFeedbackStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feedback id'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'status is required'
      });
    }

    if (!['Pending', 'Reviewed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'status must be either Pending or Reviewed'
      });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Feedback status updated successfully',
      data: feedback
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createFeedback, getFeedbacks, updateFeedbackStatus };
