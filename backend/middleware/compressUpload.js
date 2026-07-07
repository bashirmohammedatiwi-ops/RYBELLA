const path = require('path');
const { compressOriginalFile } = require('../services/imageResizeService');

function collectImagePaths(req) {
  const paths = [];
  if (req.file?.path) paths.push(req.file.path);
  if (req.files) {
    for (const value of Object.values(req.files)) {
      const list = Array.isArray(value) ? value : [value];
      for (const file of list) {
        if (file?.path && /\.(jpe?g|png|webp)$/i.test(file.path)) {
          paths.push(file.path);
        }
      }
    }
  }
  return paths;
}

async function compressAfterUpload(req, res, next) {
  const paths = collectImagePaths(req);
  if (!paths.length) return next();

  try {
    for (const absPath of paths) {
      const result = await compressOriginalFile(absPath, { minBytes: 0 });
      if (result?.compressed) {
        const name = path.basename(absPath);
        console.log(
          `[upload] compressed ${name}: ${result.before} → ${result.after} bytes (-${result.saved})`
        );
      }
    }
  } catch (error) {
    console.warn('[upload] compress failed:', error.message);
  }

  return next();
}

module.exports = { compressAfterUpload };
