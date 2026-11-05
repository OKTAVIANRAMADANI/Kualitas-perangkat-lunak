const db = require('../config/db');

// Ambil semua produk (GET)
exports.getProducts = async (req, res) => {
  try {
    // Alias 'id' menjadi '_id' agar Frontend React (MERN style) yang sudah kita buat tetap berfungsi sempurna!
    const [rows] = await db.query('SELECT id as _id, nama, kategori, deskripsi, jumlah_stok, harga, satuan, img FROM products ORDER BY created_at DESC');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tambah produk baru (POST)
exports.createProduct = async (req, res) => {
  const { nama, kategori, deskripsi, jumlah_stok, harga, satuan, img } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO products (nama, kategori, deskripsi, jumlah_stok, harga, satuan, img) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nama, kategori, deskripsi || '', jumlah_stok || 0, harga, satuan || 'Bungkusan (Kresek)', img || '']
    );
    // Return _id menyesuaikan frontend
    res.status(201).json({ _id: String(result.insertId), nama, kategori, deskripsi, jumlah_stok, harga, satuan, img });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update produk (PUT)
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { nama, kategori, deskripsi, jumlah_stok, harga, satuan, img } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE products SET nama = ?, kategori = ?, deskripsi = ?, jumlah_stok = ?, harga = ?, satuan = ?, img = ? WHERE id = ?',
      [nama, kategori, deskripsi || '', jumlah_stok, harga, satuan, img || '', id]
    );
    
    if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Produk tidak ditemukan di database' });
    }
    res.status(200).json({ _id: String(id), nama, kategori, deskripsi, jumlah_stok, harga, satuan, img });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Hapus produk (DELETE)
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Produk tidak ditemukan di database' });
    }
    res.status(200).json({ message: 'Produk berhasil dihapus!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
