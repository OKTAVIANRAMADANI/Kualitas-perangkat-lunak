const pool = require('../config/db');

exports.registerUser = async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const [existing] = await pool.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username or Email already exists' });
    }

    // In a real app we should hash the password using bcrypt. 
    // Here we store it plain for simplicity as per the existing codebase style, 
    // but a proper implementation would be better.
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, phone) VALUES (?, ?, ?, ?)',
      [username, email, password, phone || '']
    );

    // Record login history for newly registered user
    await pool.query('INSERT INTO login_history (username, action) VALUES (?, ?)', [username, 'LOGIN']);

    res.status(201).json({ id: result.insertId, username, email });
  } catch (err) {
    console.error('Error in registerUser:', err.message);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [user] = await pool.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
    
    if (user.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Record login history
    await pool.query('INSERT INTO login_history (username, action) VALUES (?, ?)', [user[0].username, 'LOGIN']);

    res.status(200).json({ id: user[0].id, username: user[0].username, email: user[0].email });
  } catch (err) {
    console.error('Error in loginUser:', err.message);
    res.status(500).json({ error: 'Failed to login' });
  }
};

exports.logoutUser = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });
    
    await pool.query('INSERT INTO login_history (username, action) VALUES (?, ?)', [username, 'LOGOUT']);
    res.status(200).json({ message: 'Logout recorded' });
  } catch (err) {
    console.error('Error in logoutUser:', err.message);
    res.status(500).json({ error: 'Failed to record logout' });
  }
};

exports.getLoginHistory = async (req, res) => {
  try {
    const [history] = await pool.query('SELECT * FROM login_history ORDER BY created_at DESC LIMIT 100');
    res.status(200).json(history);
  } catch (err) {
    console.error('Error in getLoginHistory:', err.message);
    res.status(500).json({ error: 'Failed to fetch login history' });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const [user] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    
    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = user[0];
    delete userData.password; // Don't send password
    res.status(200).json(userData);
  } catch (err) {
    console.error('Error in getUserProfile:', err.message);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const { name, phone, shopName, gender, dob_day, dob_month, dob_year } = req.body;
    
    await pool.query(
      'UPDATE users SET name = ?, phone = ?, shopName = ?, gender = ?, dob_day = ?, dob_month = ?, dob_year = ? WHERE username = ?',
      [name, phone, shopName, gender, dob_day, dob_month, dob_year, username]
    );
    
    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Error in updateUserProfile:', err.message);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, username, email, phone, created_at FROM users ORDER BY created_at DESC');
    res.status(200).json(users);
  } catch (err) {
    console.error('Error in getAllUsers:', err.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }
    
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [password, id]);
    
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error in changePassword:', err.message);
    res.status(500).json({ error: 'Failed to update password' });
  }
};
