import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../database/connection';

const router = Router();

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Autenticação necessária' } });
    }

    const userResult = await query(
      `SELECT id, username, email, created_at FROM users WHERE id = $1`,
      [userId]
    );

    const playersResult = await query(
      `SELECT * FROM players WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      data: {
        user: userResult.rows[0],
        players: playersResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/create-character', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { characterName } = req.body;
    if (!characterName || !String(characterName).trim()) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_CHARACTER_NAME', message: 'Nome do personagem é obrigatório' } });
    }

    const result = await query(
      `INSERT INTO players (user_id, character_name, level, experience, gold, gems, energy, max_energy)
       VALUES ($1, $2, 1, 0, 0, 0, 100, 100)
       RETURNING *`,
      [req.userId, String(characterName).trim()]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Personagem criado com sucesso' });
  } catch (error) {
    next(error);
  }
});

export default router;
