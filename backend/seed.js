const mysql = require('mysql2/promise');
require('dotenv').config();

const productsData = [
  {
    nama: 'Kopi Arabika Gombengsari (250g)',
    kategori: 'Kopi Biji/Bubuk',
    deskripsi: 'Kopi Arabika asli Gombengsari dengan cita rasa asam segar khas buah-buahan dan aroma floral yang kuat. Ditanam di dataran tinggi Banyuwangi.',
    jumlah_stok: 100,
    harga: 45000,
    satuan: 'Pouch',
    img: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=600&auto=format&fit=crop'
  },
  {
    nama: 'Kopi Robusta Gombengsari (250g)',
    kategori: 'Kopi Biji/Bubuk',
    deskripsi: 'Kopi Robusta dengan body yang tebal, rasa cokelat dan kacang yang pekat. Sangat cocok untuk dibuat espresso atau kopi susu kekinian.',
    jumlah_stok: 150,
    harga: 35000,
    satuan: 'Pouch',
    img: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=600&auto=format&fit=crop'
  },
  {
    nama: 'Kopi Luwak Liar Gombengsari (100g)',
    kategori: 'Kopi Premium',
    deskripsi: 'Kopi Luwak liar yang dikumpulkan langsung dari perkebunan kopi Gombengsari. Memiliki rasa yang sangat halus, minim keasaman, dan aroma yang eksotis.',
    jumlah_stok: 30,
    harga: 150000,
    satuan: 'Pouch',
    img: 'https://images.unsplash.com/photo-1611162458324-aae1eb4129a4?w=600&auto=format&fit=crop'
  },
  {
    nama: 'Espresso Blend Gombengsari (500g)',
    kategori: 'Kopi Biji/Bubuk',
    deskripsi: 'Campuran khusus (blend) 70% Robusta dan 30% Arabika Gombengsari. Diciptakan khusus untuk kedai kopi yang membutuhkan espresso base yang kuat dan seimbang.',
    jumlah_stok: 80,
    harga: 75000,
    satuan: 'Pouch',
    img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop'
  },
  {
    nama: 'Kopi Susu Gula Aren (Botol 1L)',
    kategori: 'Minuman Siap Saji',
    deskripsi: 'Kopi susu literan perpaduan espresso blend Gombengsari, susu segar, dan gula aren asli. Simpan di kulkas, nikmat diminum dingin bersama keluarga.',
    jumlah_stok: 50,
    harga: 65000,
    satuan: 'Botol',
    img: 'https://images.unsplash.com/photo-1579888944111-c917bfd3ebbe?w=600&auto=format&fit=crop'
  },
  {
    nama: 'Cold Brew Gombengsari (Botol 250ml)',
    kategori: 'Minuman Siap Saji',
    deskripsi: 'Kopi seduh dingin menggunakan biji Arabika Gombengsari yang diseduh selama 18 jam. Menghasilkan rasa kopi yang manis alami dan menyegarkan.',
    jumlah_stok: 40,
    harga: 25000,
    satuan: 'Botol',
    img: 'https://images.unsplash.com/photo-1461023058943-0708e5bc3a2d?w=600&auto=format&fit=crop'
  },
  {
    nama: 'Drip Bag Coffee Gombengsari (Isi 5)',
    kategori: 'Kopi Instan Premium',
    deskripsi: 'Kopi filter praktis siap seduh. Kemasan sachet drip bag berisi kopi Arabika Gombengsari giling segar. Cocok untuk dibawa bepergian atau ngantor.',
    jumlah_stok: 100,
    harga: 40000,
    satuan: 'Box',
    img: 'https://images.unsplash.com/photo-1620247657962-d4b971a76ce1?w=600&auto=format&fit=crop'
  },
  {
    nama: 'Paket Usaha Kedai Kopi Minimalis',
    kategori: 'Paket Lengkap',
    deskripsi: 'Paket bahan baku awal untuk buka kedai: 2kg Espresso Blend, 1kg Arabika, 5 botol sirup, dan panduan resep kopi susu kekinian ala Gombengsari.',
    jumlah_stok: 10,
    harga: 450000,
    satuan: 'Paket',
    img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop'
  }
];

const usersData = [
  {
    username: 'admin',
    email: 'admin@coffeegombengsari.com',
    password: 'admin123',
    name: 'Admin Kedai',
    phone: '080000000000',
    shopName: 'Kedai Kopi Gombengsari',
    gender: 'Perempuan',
    dob_day: '01',
    dob_month: '01',
    dob_year: '1990',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop'
  },
  {
    username: 'dani',
    email: 'dani@gmail.com',
    password: 'dani123',
    name: 'Dani Ramadani',
    phone: '081234567890',
    shopName: 'Kopi Gombengsari',
    gender: 'Laki-laki',
    dob_day: '25',
    dob_month: '06',
    dob_year: '2004',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&auto=format&fit=crop'
  }
];

const addressesData = [
  {
    username: 'dani',
    name: 'Dani Ramadani',
    phone: '081234567890',
    province_city_district: 'Jawa Timur, Banyuwangi, Kalipuro',
    street_details: 'Jl. Gombengsari No. 45, RT 02/RW 03',
    other_details: 'Rumah dengan cat pagar hitam, di seberang warung kopi seduh',
    label: 'Rumah',
    is_default: true
  }
];

const expensesData = [
  {
    tanggal: '2026-06-20 09:00:00',
    kategori: 'Bahan Baku',
    deskripsi: 'Pembelian Biji Kopi Mentah (Green Beans) Arabika 50kg dari Petani',
    nominal: 3500000,
    pengguna: 'Owner',
    lampiran: 'https://images.unsplash.com/photo-1587525492147-3ba8ebc88e73?w=600&auto=format&fit=crop'
  }
];

const chatsData = [
  {
    room_id: 'dani',
    sender: 'dani',
    message: 'Halo admin, apakah Kopi Arabika Gombengsari ready?'
  },
  {
    room_id: 'dani',
    sender: 'Admin Kedai',
    message: 'Halo Kak Dani! Ready banyak Kak, baru selesai di roasting.'
  }
];

async function seed() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'coffee_gombengsari_db',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
  });

  console.log('🔄 Memulai proses seeding database...');

  try {
    const connection = await pool.getConnection();

    // 1. Seed Products
    console.log('📦 Menghapus dan men-seed tabel products...');
    await connection.query('DROP TABLE IF EXISTS products');
    await connection.query(`
      CREATE TABLE products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(255) NOT NULL,
        kategori VARCHAR(100) NOT NULL,
        deskripsi TEXT,
        jumlah_stok INT DEFAULT 0,
        harga INT NOT NULL,
        satuan VARCHAR(50) NOT NULL DEFAULT 'Pouch',
        img LONGTEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    for (const prod of productsData) {
      await connection.query(
        'INSERT INTO products (nama, kategori, deskripsi, jumlah_stok, harga, satuan, img) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [prod.nama, prod.kategori, prod.deskripsi, prod.jumlah_stok, prod.harga, prod.satuan, prod.img]
      );
    }
    console.log('✅ Berhasil men-seed tabel products.');

    // Ambil beberapa product ID yang baru diinsert untuk membuat pesanan/order mock
    const [insertedProducts] = await connection.query('SELECT id as _id, nama, harga FROM products');

    // 2. Seed Users
    console.log('👤 Men-seed tabel users...');
    for (const userData of usersData) {
      await connection.query('DELETE FROM users WHERE username = ? OR email = ?', [userData.username, userData.email]);
      await connection.query(
        `INSERT INTO users (username, email, password, name, phone, shopName, gender, dob_day, dob_month, dob_year, avatar)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userData.username,
          userData.email,
          userData.password,
          userData.name,
          userData.phone,
          userData.shopName,
          userData.gender,
          userData.dob_day,
          userData.dob_month,
          userData.dob_year,
          userData.avatar
        ]
      );
    }
    console.log('✅ Berhasil men-seed tabel users.');

    // 3. Seed Addresses
    console.log('📍 Menghapus dan men-seed tabel addresses...');
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

    for (const addr of addressesData) {
      await connection.query(
        `INSERT INTO addresses (username, name, phone, province_city_district, street_details, other_details, label, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [addr.username, addr.name, addr.phone, addr.province_city_district, addr.street_details, addr.other_details, addr.label, addr.is_default]
      );
    }
    console.log('✅ Berhasil men-seed tabel addresses.');

    // 4. Seed Expenses
    console.log('💸 Menghapus dan men-seed tabel expenses...');
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

    for (const exp of expensesData) {
      await connection.query(
        'INSERT INTO expenses (tanggal, kategori, deskripsi, nominal, pengguna, lampiran) VALUES (?, ?, ?, ?, ?, ?)',
        [exp.tanggal, exp.kategori, exp.deskripsi, exp.nominal, exp.pengguna, exp.lampiran]
      );
    }
    console.log('✅ Berhasil men-seed tabel expenses.');

    // 5. Seed Orders
    console.log('🛒 Menghapus dan men-seed tabel orders...');
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

    const product1 = insertedProducts[0];
    const pesanan1 = [
      {
        _id: String(product1._id),
        nama: product1.nama,
        harga: product1.harga,
        jumlah: 2
      }
    ];

    const ordersData = [
      {
        nama_pelanggan: 'dani',
        no_wa: '081234567890',
        alamat: 'Jl. Gombengsari No. 45, RT 02/RW 03, Kalipuro, Banyuwangi (Pagar hitam)',
        pesanan: JSON.stringify(pesanan1),
        total_harga: product1.harga * 2,
        metode_pembayaran: 'COD',
        metode_pengiriman: 'Kirim dari kedai',
        status: 'Proses'
      }
    ];

    for (const ord of ordersData) {
      await connection.query(
        `INSERT INTO orders (nama_pelanggan, no_wa, alamat, pesanan, total_harga, metode_pembayaran, metode_pengiriman, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [ord.nama_pelanggan, ord.no_wa, ord.alamat, ord.pesanan, ord.total_harga, ord.metode_pembayaran, ord.metode_pengiriman, ord.status]
      );
    }
    console.log('✅ Berhasil men-seed tabel orders.');

    // 6. Seed Chats
    console.log('💬 Menghapus dan men-seed tabel chats...');
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

    for (const chat of chatsData) {
      await connection.query(
        'INSERT INTO chats (room_id, sender, message) VALUES (?, ?, ?)',
        [chat.room_id, chat.sender, chat.message]
      );
    }
    console.log('✅ Berhasil men-seed tabel chats.');

    connection.release();
    console.log('🎉 PROSES SEEDING SELESAI DENGAN SUKSES!');
  } catch (error) {
    console.error('❌ GAGAL melakukan seeding database:', error.message);
  } finally {
    await pool.end();
  }
}

seed();
