const db = require('../config/db');

// Ambil semua pengeluaran (GET)
exports.getExpenses = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM expenses ORDER BY tanggal DESC');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tambah pengeluaran baru (POST)     
exports.createExpense = async (req, res) => {
  const { tanggal, kategori, deskripsi, nominal, pengguna, lampiran } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO expenses (tanggal, kategori, deskripsi, nominal, pengguna, lampiran) VALUES (?, ?, ?, ?, ?, ?)',
      [tanggal, kategori, deskripsi || '', nominal, pengguna || 'Owner', lampiran || '']
    );
    res.status(201).json({ id: result.insertId, tanggal, kategori, deskripsi, nominal, pengguna, lampiran });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update pengeluaran (PUT)
exports.updateExpense = async (req, res) => {
  const { id } = req.params;
  const { tanggal, kategori, deskripsi, nominal, pengguna, lampiran } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE expenses SET tanggal = ?, kategori = ?, deskripsi = ?, nominal = ?, pengguna = ?, lampiran = ? WHERE id = ?',
      [tanggal, kategori, deskripsi || '', nominal, pengguna || 'Owner', lampiran || '', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Pengeluaran tidak ditemukan' });
    }
    res.status(200).json({ id, tanggal, kategori, deskripsi, nominal, pengguna, lampiran });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Hapus pengeluaran (DELETE)
exports.deleteExpense = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM expenses WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Pengeluaran tidak ditemukan' });
    }
    res.status(200).json({ message: 'Pengeluaran berhasil dihapus!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
