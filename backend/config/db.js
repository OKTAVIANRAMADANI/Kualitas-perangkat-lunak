const mysql = require('mysql2/promise');
require('dotenv').config();

// Buat koneksi pool ke database MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'umkm_tahu_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test koneksi & auto-create table 'products' & 'orders' jika belum ada di database
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Koneksi ke Database MySQL Berhasil!");
    
    // Perbarui skema dengan menge-drop khusus karena sedang proses revisi dari klien
    await connection.query('DROP TABLE IF EXISTS products');

    await connection.query(`
      CREATE TABLE products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(255) NOT NULL,
        kategori VARCHAR(100) NOT NULL,
        deskripsi TEXT,
        jumlah_stok INT DEFAULT 0,
        harga INT NOT NULL,
        satuan VARCHAR(50) NOT NULL DEFAULT 'Bungkusan (Kresek)',
        img LONGTEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Auto Setup Table Orders (Pemesan Pelanggan)
    
    // Perbarui skema dengan menge-drop karena sedang dalam mode development
    await connection.query('DROP TABLE IF EXISTS orders');

    await connection.query(`
      CREATE TABLE orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_pelanggan VARCHAR(255) NOT NULL,
        no_wa VARCHAR(20) NOT NULL,
        alamat TEXT DEFAULT NULL,
        pesanan LONGTEXT NOT NULL,
        total_harga INT NOT NULL,
        metode_pembayaran VARCHAR(50) NOT NULL DEFAULT 'COD',
        metode_pengiriman VARCHAR(50) NOT NULL DEFAULT 'Ambil Sendiri',
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("✅ Structur Tabel 'products' dan 'orders' sudah siap digunakan.");

    await connection.query('DROP TABLE IF EXISTS chats');
    await connection.query(`
      CREATE TABLE chats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_id VARCHAR(100) NOT NULL,
        sender VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Structur Tabel 'chats' (Per-Pelanggan) sudah siap digunakan.");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) DEFAULT NULL,
        phone VARCHAR(50) DEFAULT NULL,
        shopName VARCHAR(255) DEFAULT NULL,
        gender VARCHAR(50) DEFAULT NULL,
        dob_day VARCHAR(10) DEFAULT NULL,
        dob_month VARCHAR(10) DEFAULT NULL,
        dob_year VARCHAR(10) DEFAULT NULL,
        avatar VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Safety fallback to add columns if table already existed before without dropping it
    try {
      await connection.query("ALTER TABLE users ADD COLUMN name VARCHAR(255) DEFAULT NULL");
      await connection.query("ALTER TABLE users ADD COLUMN phone VARCHAR(50) DEFAULT NULL");
      await connection.query("ALTER TABLE users ADD COLUMN shopName VARCHAR(255) DEFAULT NULL");
      await connection.query("ALTER TABLE users ADD COLUMN gender VARCHAR(50) DEFAULT NULL");
      await connection.query("ALTER TABLE users ADD COLUMN dob_day VARCHAR(10) DEFAULT NULL");
      await connection.query("ALTER TABLE users ADD COLUMN dob_month VARCHAR(10) DEFAULT NULL");
      await connection.query("ALTER TABLE users ADD COLUMN dob_year VARCHAR(10) DEFAULT NULL");
      await connection.query("ALTER TABLE users ADD COLUMN avatar VARCHAR(255) DEFAULT NULL");
    } catch(e) {} // Ignore if columns already exist
    console.log("✅ Structur Tabel 'users' sudah siap digunakan.");
    
    await connection.query('DROP TABLE IF EXISTS expenses');
    await connection.query(`
      CREATE TABLE expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tanggal DATETIME NOT NULL,
        kategori VARCHAR(100) NOT NULL,
        deskripsi TEXT,
        nominal INT NOT NULL,
        pengguna VARCHAR(255) DEFAULT 'Owner',
        lampiran LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Structur Tabel 'expenses' sudah siap digunakan.");
    
    
    await connection.query('DROP TABLE IF EXISTS addresses');
    await connection.query(`
      CREATE TABLE addresses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        province_city_district VARCHAR(255) NOT NULL,
        street_details TEXT NOT NULL,
        other_details TEXT,
        label VARCHAR(50) DEFAULT 'Rumah',
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Structur Tabel 'addresses' sudah siap digunakan.");
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS login_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        action VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Structur Tabel 'login_history' sudah siap digunakan.");
    
    connection.release();
  } catch (err) {
    if(err.code === 'ER_BAD_DB_ERROR') {
      console.error(`❌ GAGAL: Database '${process.env.DB_NAME}' belum ada di MySQL Anda!`);
      console.error(`   -> Tolong buat dulu database bernama '${process.env.DB_NAME}' di phpMyAdmin / MySQL.`);
    } else {
      console.error("❌ Gagal koneksi ke MySQL:", err.message);
    }
  }
})();

module.exports = pool;
