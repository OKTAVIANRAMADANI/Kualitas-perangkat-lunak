const db = require('../config/db');

// GET semua pesanan pelanggan (Admin Only)
exports.getOrders = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET 1 pesanan berdasarkan ID (Pelanggan Tracking Active)
exports.getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Order tidak ditemukan' });
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET riwayat pesanan pelanggan berdasarkan Nama (Pencarian Fleksibel)
exports.getOrdersByName = async (req, res) => {
  const { name } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM orders WHERE nama_pelanggan LIKE ? ORDER BY created_at DESC', [`%${name}%`]);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createOrder = async (req, res) => {
  const { nama_pelanggan, no_wa, alamat, pesanan, total_harga, metode_pembayaran, metode_pengiriman, bukti_pembayaran } = req.body;
  
  try {
    // Pesanan dari frontend sudah berbentuk string JSON valid
    const pesananStr = typeof pesanan === 'string' ? pesanan : JSON.stringify(pesanan);
    let pesananArray = [];
    
    try {
        pesananArray = typeof pesanan === 'string' ? JSON.parse(pesanan) : pesanan;
    } catch(e) {
        pesananArray = [];
    }
    
    // 1. Masukkan pesanan ke database
    const [result] = await db.query(
      'INSERT INTO orders (nama_pelanggan, no_wa, alamat, pesanan, total_harga, metode_pembayaran, metode_pengiriman, bukti_pembayaran) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nama_pelanggan, no_wa, alamat, pesananStr, total_harga, metode_pembayaran || 'COD', metode_pengiriman || 'Ambil Sendiri', bukti_pembayaran || null]
    );

    // 2. Pengurangan stok otomatis pada inventory tahu
    if (pesananArray && pesananArray.length > 0) {
      for (let item of pesananArray) {
        // item._id bisa jadi id produk (karena frontend alias id as _id)
        const prodId = item._id || item.id;
        // Gunakan GREATEST agar stok tidak negatif
        if (prodId) {
            await db.query(
              'UPDATE products SET jumlah_stok = GREATEST(jumlah_stok - ?, 0) WHERE id = ?',
              [item.jumlah || 1, prodId]
            );
        }
      }
    }

    res.status(201).json({ 
        id: result.insertId, 
        message: "Pesanan berhasil dibuat! Stok langsung diamankan." 
    });
  } catch (error) {
    console.error("Order Error:", error);
    res.status(400).json({ message: error.message });
  }
};

// Update status pesanan (PUT)
exports.updateOrder = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, id]
    );
    if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    }
    res.status(200).json({ message: 'Status berhasil diubah', status });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Hapus pesanan (DELETE)
exports.deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM orders WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    }
    res.status(200).json({ message: 'Pesanan berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
