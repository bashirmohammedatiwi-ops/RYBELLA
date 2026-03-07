const db = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const [brands] = await db.query('SELECT * FROM brands ORDER BY name');
    res.json(brands);
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    const logo = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name) {
      return res.status(400).json({ message: 'اسم العلامة التجارية مطلوب' });
    }

    const [result] = await db.query('INSERT INTO brands (name, logo) VALUES (?, ?)', [name, logo]);
    res.status(201).json({ message: 'تم إنشاء العلامة التجارية بنجاح', id: result.insertId });
  } catch (error) {
    console.error('Create brand error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.update = async (req, res) => {
  try {
    const { name } = req.body;
    const logo = req.file ? `/uploads/${req.file.filename}` : undefined;

    let query = 'UPDATE brands SET name = ?';
    const params = [name];
    if (logo) {
      query += ', logo = ?';
      params.push(logo);
    }
    query += ' WHERE id = ?';
    params.push(req.params.id);
    await db.query(query, params);
    res.json({ message: 'تم تحديث العلامة التجارية بنجاح' });
  } catch (error) {
    console.error('Update brand error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

exports.delete = async (req, res) => {
  try {
    await db.query('DELETE FROM brands WHERE id = ?', [req.params.id]);
    res.json({ message: 'تم حذف العلامة التجارية بنجاح' });
  } catch (error) {
    console.error('Delete brand error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};
