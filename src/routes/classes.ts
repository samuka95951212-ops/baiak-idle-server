import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../database/connection';
import logger from '../config/logger';
import { AppError } from '../types';

const router = Router();

// Classes disponíveis com seus atributos iniciais
const CLASSES = {
  Knight: {
    attack: 22,
    defense: 18,
    health: 140,
    crit_chance: 7,
    crit_damage: 1.3,
    description: 'Guerreiro equilibrado com defesa moderada',
  },
  Paladin: {
    attack: 18,
    defense: 20,
    health: 150,
    crit_chance: 10,
    crit_damage: 1.45,
    description: 'Tanque robusto, excelente defesa',
  },
  Sorcerer: {
    attack: 28,
    defense: 10,
    health: 120,
    crit_chance: 14,
    crit_damage: 1.7,
    description: 'Mágico poderoso, ataque alto mas frágil',
  },
  Druid: {
    attack: 16,
    defense: 12,
    health: 160,
    crit_chance: 12,
    crit_damage: 1.5,
    description: 'Curador equilibrado, vida alta',
  },
  Monk: {
    attack: 20,
    defense: 14,
    health: 135,
    crit_chance: 15,
    crit_damage: 1.6,
    description: 'Equilibrado com chance de crítico alta',
  },
};

// GET: Listar todas as classes disponíveis
router.get('/available', (req: Request, res: Response) => {
  const classesData = Object.entries(CLASSES).map(([name, stats]) => ({
    name,
    ...stats,
  }));

  res.status(200).json({
    success: true,
    data: classesData,
    requestId: req.id,
  });
});

// POST: Criar novo personagem com classe
router.post('/create', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Autenticação necessária', 'UNAUTHORIZED');
    }

    const { character_name, class_name } = req.body;

    if (!character_name || !String(character_name).trim()) {
      throw new AppError(400, 'Nome do personagem é obrigatório', 'INVALID_NAME');
    }

    if (!class_name || !CLASSES[class_name as keyof typeof CLASSES]) {
      throw new AppError(400, 'Classe inválida', 'INVALID_CLASS');
    }

    const classStats = CLASSES[class_name as keyof typeof CLASSES];

    const result = await query(
      `INSERT INTO players (
        user_id, character_name, class_name, level, experience, gold, gems,
        energy, max_energy, attack, defense, health, crit_chance, crit_damage,
        is_active, created_at, updated_at, last_action
      ) VALUES ($1, $2, $3, 1, 0, 100, 0, 100, 100, $4, $5, $6, $7, $8, true, NOW(), NOW(), NOW())
      RETURNING *`,
      [
        req.userId,
        String(character_name).trim(),
        class_name,
        classStats.attack,
        classStats.defense,
        classStats.health,
        classStats.crit_chance,
        classStats.crit_damage,
      ]
    );

    logger.info(`Personagem criado: ${character_name} (${class_name}) para usuário ${req.userId}`);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: `Personagem ${character_name} criado com sucesso na classe ${class_name}`,
      requestId: req.id,
    });
  } catch (error) {
    next(error);
  }
});

// GET: Listar personagens do usuário
router.get('/list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Autenticação necessária', 'UNAUTHORIZED');
    }

    const result = await query(
      `SELECT id, character_name, class_name, level, experience, gold, gems, health, attack, defense, crit_chance, crit_damage, created_at
       FROM players WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC`,
      [req.userId]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
      requestId: req.id,
    });
  } catch (error) {
    next(error);
  }
});

// GET: Obter detalhes do personagem
router.get('/:playerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Autenticação necessária', 'UNAUTHORIZED');
    }

    const result = await query(
      `SELECT * FROM players WHERE id = $1 AND user_id = $2 AND is_active = true`,
      [req.params.playerId, req.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'Personagem não encontrado', 'PLAYER_NOT_FOUND');
    }

    const player = result.rows[0];
    const nextLevelExp = Math.floor(100 * Math.pow(1.3, player.level - 1));

    res.status(200).json({
      success: true,
      data: {
        ...player,
        nextLevelExp,
      },
      requestId: req.id,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
