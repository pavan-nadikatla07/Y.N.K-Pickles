export const errorHandler = (err, req, res, next) => {
  console.error('[Error Logger]', {
    message: err.message,
    path: req.originalUrl,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Image upload failed. File size cannot exceed 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Image upload error: ${err.message}`
    });
  }

  // Handle custom upload errors
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // Handle MongoDB Duplicate Key (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
    let userMsg = `A record with this ${field} already exists.`;
    if (field === 'phone') {
      userMsg = 'This phone number is already registered. Please log in instead.';
    } else if (field === 'slug') {
      userMsg = 'A product with this name/slug already exists. Please choose a unique name.';
    }
    return res.status(409).json({
      success: false,
      message: userMsg,
      field
    });
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join('. ')
    });
  }

  // Handle JWT Error
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session. Please log in again.'
    });
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  const responseMessage =
    statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message: responseMessage
  });
};
