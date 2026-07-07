const express = require('express');
const router = express.Router();
const { getOptimizedImage } = require('../services/imageResizeService');

router.get('/', async (req, res) => {
  try {
    const { src, w, q, f } = req.query;
    const result = await getOptimizedImage({
      src,
      width: w,
      quality: q,
      format: f,
    });

    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.set('Vary', 'Accept');
    res.type(result.contentType);
    res.send(result.buffer);
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) console.error('Image optimize error:', error.message);
    res.status(status).json({ message: error.message || 'تعذّر تحميل الصورة' });
  }
});

module.exports = router;
