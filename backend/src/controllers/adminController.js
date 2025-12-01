import pool from '../config/db.js';

export const createChapter = async (req, res) => {
  const { title, description, order } = req.body;
  try {
    const newChap = await pool.query(
      'INSERT INTO chapters (title, description, sequence_order) VALUES ($1, $2, $3) RETURNING *',
      [title, description, order]
    );
    res.json(newChap.rows[0]);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

export const createExercise = async (req, res) => {
  const { chapter_id, title, type, xp_reward, questions } = req.body; 
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const exRes = await client.query(
      // FIX: Fallback to 10 if xp_reward is missing
      'INSERT INTO exercises (chapter_id, title, type, xp_reward) VALUES ($1, $2, $3, $4) RETURNING *',
      [chapter_id, title, type, xp_reward || 10]
    );
    const exerciseId = exRes.rows[0].exercise_id;

    for (const q of questions) {
      await client.query(
        'INSERT INTO questions (exercise_id, question_type, content) VALUES ($1, $2, $3)',
        [exerciseId, q.question_type, JSON.stringify(q.content)]
      );
    }

    await client.query('COMMIT');
    res.json({ msg: 'Exercise created successfully', exercise: exRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).send('Server Error');
  } finally {
    client.release();
  }
};

export const toggleChapterLock = async (req, res) => {
  const { batch_id, chapter_id, unlock } = req.body;
  try {
    if (unlock) {
      await pool.query(
        'INSERT INTO batch_chapter_access (batch_id, chapter_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [batch_id, chapter_id]
      );
    } else {
      await pool.query(
        'DELETE FROM batch_chapter_access WHERE batch_id = $1 AND chapter_id = $2',
        [batch_id, chapter_id]
      );
    }
    res.json({ msg: `Chapter ${unlock ? 'unlocked' : 'locked'} for batch` });
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

export const getStudentProgress = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT b.batch_id, b.batch_name, COUNT(u.user_id) as students, SUM(COALESCE(xp.total, 0)) as total_batch_xp
      FROM batches b
      LEFT JOIN users u ON b.batch_id = u.batch_id
      LEFT JOIN (SELECT user_id, SUM(xp_gained) as total FROM user_progress GROUP BY user_id) xp ON u.user_id = xp.user_id
      GROUP BY b.batch_id
      ORDER BY b.batch_id ASC
    `);
    res.json(stats.rows);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

export const getChapters = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM chapters ORDER BY sequence_order ASC');
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).send('Server Error'); }
};

export const getStudentHistory = async (req, res) => {
  const { id } = req.params;
  try {
    const history = await pool.query(`
      SELECT 
        up.progress_id,
        e.title,
        e.type,
        up.xp_gained,
        up.mistakes,
        up.completed_at
      FROM user_progress up
      LEFT JOIN exercises e ON up.lesson_id = CAST(e.exercise_id AS VARCHAR)
      WHERE up.user_id = $1
      ORDER BY up.completed_at DESC
    `, [id]);
    res.json(history.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

export const getBatchAccess = async (req, res) => {
  try {
    const result = await pool.query('SELECT batch_id, chapter_id FROM batch_chapter_access');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

export const createStudyMaterial = async (req, res) => {
  const { chapter_id, title, content, category } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO study_materials (chapter_id, title, content, category) VALUES ($1, $2, $3, $4) RETURNING *',
      [chapter_id, title, content, category || 'grammar']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};