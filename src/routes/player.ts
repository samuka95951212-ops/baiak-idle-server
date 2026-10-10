import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../database/connection';
import logger from '../config/logger';
import { AppError } from '../types';

const router = Router();

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Autenticação necessária', 'UNAUTHORIZED');
    }

    const userResult = await query(
      `SELECT id, username, email, created_at, last_login FROM users WHERE id = $1 AND is_active = true`,
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      throw new AppError(404, 'Usuário não encontrado', 'USER_NOT_FOUND');
    }

    const playersResult = await query(
      `SELECT id, character_name, class_name, level, experience, gold, gems, energy, max_energy, attack, defense, health, crit_chance, crit_damage, created_at
       FROM players WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC`,
      [req.userId]
    );

    res.status(200).json({
      success: true,
      data: {
        user: userResult.rows[0],
        players: playersResult.rows,
      },
      requestId: req.id,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/create-character', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Autenticação necessária', 'UNAUTHORIZED');
    }

    const { characterName, className } = req.body;

    if (!characterName || !String(characterName).trim()) {
      throw new AppError(400, 'Nome do personagem é obrigatório', 'INVALID_CHARACTER_NAME');
    }

    const validClasses = ['Knight', 'Paladin', 'Sorcerer', 'Druid', 'Monk'];
    const playerClass = validClasses.includes(className) ? className : 'Knight';

    const classStats: Record<string, any> = {
      Knight: { attack: 22, defense: 18, health: 140, crit_chance: 7, crit_damage: 1.3 },
      Paladin: { attack: 18, defense: 20, health: 150, crit_chance: 10, crit_damage: 1.45 },
      Sorcerer: { attack: 28, defense: 10, health: 120, crit_chance: 14, crit_damage: 1.7 },
      Druid: { attack: 16, defense: 12, health: 160, crit_chance: 12, crit_damage: 1.5 },
      Monk: { attack: 20, defense: 14, health: 135, crit_chance: 15, crit_damage: 1.6 },
    };

    const stats = classStats[playerClass];

    const result = await query(
      `INSERT INTO players (
        user_id,
        character_name,
        class_name,
        level,
        experience,
        gold,
        gems,
        energy,
        max_energy,
        attack,
        defense,
        health,
        crit_chance,
        crit_damage,
        mount_id
      ) VALUES ($1, $2, $3, 1, 0, 0, 0, 100, 100, $4, $5, $6, $7, $8, NULL)
      RETURNING *`,
      [
        req.userId,
        String(characterName).trim(),
        playerClass,
        stats.attack,
        stats.defense,
        stats.health,
        stats.crit_chance,
        stats.crit_damage,
      ]
    );

    logger.info(`Personagem criado para usuário ${req.userId}: ${characterName} (${playerClass})`);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Personagem criado com sucesso',
      requestId: req.id,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
