/**
 * Returns user-friendly error message.
 * In development, returns actual error for debugging.
 */
function getErrorMessage(error) {
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev && error?.message) {
    return error.message;
  }
  return 'حدث خطأ في الخادم';
}

module.exports = { getErrorMessage };
