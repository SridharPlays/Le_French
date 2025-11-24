import pool from '../config/db.js';

// Get Leaderboard
export const getLeaderboard = async (req, res) => {
  const { batch_id } = req.params;

  try {
    const query = `
      SELECT
        u.name,
        SUM(p.xp_gained) AS weekly_xp
      FROM
        users u
      JOIN
        user_progress p ON u.user_id = p.user_id
      WHERE
        u.batch_id = $1
        AND p.completed_at >= date_trunc('week', NOW())
      GROUP BY
        u.user_id, u.name
      ORDER BY
        weekly_xp DESC
      LIMIT 10;
    `;

    const leaderboard = await pool.query(query, [batch_id]);
    res.json(leaderboard.rows);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get Current User Progress
export const getUserProgress = async (req, res) => {
  try {
    const query = `
      SELECT up.lesson_id, up.xp_gained, up.mistakes, up.completed_at, e.title 
      FROM user_progress up
      LEFT JOIN exercises e ON up.lesson_id = CAST(e.exercise_id AS VARCHAR)
      WHERE up.user_id = $1 
      ORDER BY up.completed_at DESC
    `;

    const lessons = await pool.query(query, [req.user.id]);
    const totalXp = await pool.query(
        'SELECT COALESCE(SUM(xp_gained), 0) as total FROM user_progress WHERE user_id = $1',
        [req.user.id]
    );

    res.json({
        lessons: lessons.rows,
        total_xp: totalXp.rows[0].total || 0
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

export const addProgress = async (req, res) => {
  const { lesson_id, xp_gained, mistakes } = req.body; 
  const user_id = req.user.id;

  if (!lesson_id || xp_gained === undefined) {
    return res.status(400).json({ msg: 'Missing lesson_id or xp_gained' });
  }

  try {
    const newProgress = await pool.query(
      'INSERT INTO user_progress (user_id, lesson_id, xp_gained, mistakes) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, String(lesson_id), xp_gained, mistakes || 0]
    );

    res.status(201).json(newProgress.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

export const getBatchDetails = async (req, res) => {
  const { batch_id } = req.params;
  try {
    const batchRes = await pool.query('SELECT batch_name FROM batches WHERE batch_id = $1', [batch_id]);
    const batchName = batchRes.rows.length > 0 ? batchRes.rows[0].batch_name : 'Unknown Batch';

    // Update query to show total mistakes or attempts if you want detailed reporting later
    const query = `
      SELECT u.user_id, u.name, u.email, u.registration_number,
        COALESCE(SUM(p.xp_gained), 0) as total_xp,
        COUNT(p.progress_id) as lessons_completed
      FROM users u
      LEFT JOIN user_progress p ON u.user_id = p.user_id
      WHERE u.batch_id = $1
      GROUP BY u.user_id, u.name, u.email, u.registration_number
      ORDER BY total_xp DESC;
    `;
    const studentsRes = await pool.query(query, [batch_id]);

    res.json({ batch_name: batchName, students: studentsRes.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

export const getStudentExercises = async (req, res) => {
  const userId = req.user.id; 
  try {
    const userRes = await pool.query('SELECT batch_id FROM users WHERE user_id = $1', [userId]);
    if (userRes.rows.length === 0) return res.status(404).json({ msg: "User not found" });
    const batch_id = userRes.rows[0].batch_id;
    if (!batch_id) return res.json([]); 

    const query = `
      SELECT e.exercise_id, e.title, e.type, e.xp_reward, c.title as chapter_title
      FROM exercises e
      JOIN chapters c ON e.chapter_id = c.chapter_id
      JOIN batch_chapter_access bca ON c.chapter_id = bca.chapter_id
      WHERE bca.batch_id = $1
      ORDER BY c.sequence_order ASC, e.exercise_id ASC;
    `;
    const result = await pool.query(query, [batch_id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

export const getExerciseDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const exerciseRes = await pool.query('SELECT * FROM exercises WHERE exercise_id = $1', [id]);
    if (exerciseRes.rows.length === 0) return res.status(404).json({ msg: 'Exercise not found' });
    const questionsRes = await pool.query('SELECT * FROM questions WHERE exercise_id = $1 ORDER BY question_id ASC', [id]);
    res.json({ ...exerciseRes.rows[0], questions: questionsRes.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};