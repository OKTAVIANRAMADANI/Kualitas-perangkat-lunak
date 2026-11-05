const db = require('../config/db');

exports.getChats = async (req, res) => {
  const { room } = req.query;
  try {
    let query = 'SELECT * FROM chats ORDER BY created_at ASC';
    let params = [];
    if (room) {
       query = 'SELECT * FROM chats WHERE room_id = ? ORDER BY created_at ASC';
       params = [room];
    }
    const [rows] = await db.query(query, params);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRooms = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT room_id, MAX(created_at) as last_activity, COUNT(*) as total_msg FROM chats GROUP BY room_id ORDER BY last_activity DESC');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendChat = async (req, res) => {
  const { room_id, sender, message } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO chats (room_id, sender, message) VALUES (?, ?, ?)',
      [room_id, sender, message]
    );
    res.status(201).json({ id: result.insertId, room_id, sender, message });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
