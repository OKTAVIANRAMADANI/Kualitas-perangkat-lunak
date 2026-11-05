const db = require('../config/db');

// Ambil semua alamat user (GET)
exports.getAddresses = async (req, res) => {
  const { username } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM addresses WHERE username = ? ORDER BY is_default DESC, created_at DESC', [username]);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tambah alamat baru (POST)
exports.createAddress = async (req, res) => {
  const { username, name, phone, province_city_district, street_details, other_details, label, is_default } = req.body;
  try {
    // Jika is_default true, reset alamat lain milik user ini
    if (is_default) {
      await db.query('UPDATE addresses SET is_default = FALSE WHERE username = ?', [username]);
    }

    const [result] = await db.query(
      'INSERT INTO addresses (username, name, phone, province_city_district, street_details, other_details, label, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [username, name, phone, province_city_district, street_details, other_details || '', label || 'Rumah', is_default || false]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update alamat (PUT)
exports.updateAddress = async (req, res) => {
  const { id } = req.params;
  const { username, name, phone, province_city_district, street_details, other_details, label, is_default } = req.body;
  try {
    if (is_default) {
      await db.query('UPDATE addresses SET is_default = FALSE WHERE username = ?', [username]);
    }

    const [result] = await db.query(
      'UPDATE addresses SET name = ?, phone = ?, province_city_district = ?, street_details = ?, other_details = ?, label = ?, is_default = ? WHERE id = ?',
      [name, phone, province_city_district, street_details, other_details || '', label || 'Rumah', is_default || false, id]
    );
    
    if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Alamat tidak ditemukan' });
    }
    res.status(200).json({ id, ...req.body });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Set Alamat Utama (PATCH)
exports.setDefaultAddress = async (req, res) => {
    const { id } = req.params;
    const { username } = req.body;
    try {
        await db.query('UPDATE addresses SET is_default = FALSE WHERE username = ?', [username]);
        await db.query('UPDATE addresses SET is_default = TRUE WHERE id = ?', [id]);
        res.status(200).json({ message: 'Alamat utama berhasil diperbarui' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Hapus alamat (DELETE)
exports.deleteAddress = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM addresses WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Alamat tidak ditemukan' });
    }
    res.status(200).json({ message: 'Alamat berhasil dihapus!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
