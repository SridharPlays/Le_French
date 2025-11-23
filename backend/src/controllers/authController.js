import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export const registerUser = async (req, res) => {
  const { name, email, password, registration_number, batch_id } = req.body;

  if (!name || !email || !password || !batch_id) {
    return res.status(400).json({ msg: 'Please enter all required fields' });
  }

  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      'INSERT INTO users (name, email, password_hash, registration_number, batch_id) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, name, email, batch_id',
      [name, email, passwordHash, registration_number, batch_id]
    );

    const payload = { user: { id: newUser.rows[0].user_id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '3600s' });

    res.json({ token, user: newUser.rows[0] });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    const payload = { user: { id: user.user_id, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    delete user.password_hash;

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  };
}

export const logoutUser = (req, res) => {
  res.clearCookie('token');
  res.json({ msg: 'Logged out' });
};

export const getBatches = async (req, res) => {
  try {
    const batches = await pool.query('SELECT * FROM batches ORDER BY batch_name');
    res.json(batches.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await pool.query('SELECT user_id, name, email, role, batch_id, registration_number FROM users WHERE user_id = $1', [req.user.id]);
    res.json(user.rows[0]);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};