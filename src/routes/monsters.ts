import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../database/connection';
import logger from '../config/logger';
import { AppError } from '../types';

const router = Router();

// Monstros básicos com seus atributos
const MONSTERS = {
  Goblin: {
    level: 1,
    health: 30,
    attack: 8,
    defense: 2,
    xp_reward: 50,
    gold_reward: 25,
    drop_chance: 0.6,
    rare_drop_chance: 0.1,
  },
  Orc: {
    level: 2,
    health: 50,
    attack: 12,
    defense: 4,
    xp_reward: 100,
    gold_reward: 50,
    drop_chance: 0.65,
    rare_drop_chance: 0.15,
  },
  Troll: {
    level: 3,
    health: 80,
    attack: 15,
    defense: 6,
    xp_reward: 150,
    gold_reward: 100,
    drop_chance: 0.7,
    rare_drop_chance: 0.2,
  },
  Dragon: {
    level: 5,
    health: 200,
    attack: 30,
    defense: 10,
    xp_reward: 500,
    gold_reward: 300,
    drop_chance: 0.9,
    rare_drop_chance: 0.5,
  },
};

// GET: Listar monstros disponíveis
router.get('/available', (req: Request, res: Response) => {
  const monstersData = Object.entries(MONSTERS).map(([name, stats]) => ({
    name,
    ...stats,
  }));

  res.status(200).json({
    success: true,
    data: monstersData,
    requestId: req.id,
  });
});

// POST: Atacar um monstro
router.post('/attack', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Autenticação necessária', 'UNAUTHORIZED');
    }

    const { player_id, monster_name } = req.body;

    if (!player_id || !monster_name) {
      throw new AppError(400, 'player_id e monster_name são obrigatórios', 'MISSING_FIELDS');
    }

    // Verificar se o personagem pertence ao usuário
    const playerResult = await query(
      `SELECT * FROM players WHERE id = $1 AND user_id = $2`,
      [player_id, req.userId]
    );

    if (playerResult.rows.length === 0) {
      throw new AppError(404, 'Personagem não encontrado', 'PLAYER_NOT_FOUND');
    }

    // Verificar se o monstro existe
    if (!MONSTERS[monster_name as keyof typeof MONSTERS]) {
      throw new AppError(400, 'Monstro inválido', 'INVALID_MONSTER');
    }

    const player = playerResult.rows[0];
    const monster = MONSTERS[monster_name as keyof typeof MONSTERS];

    // Verificar energia
    if (player.energy < 10) {
      throw new AppError(400, 'Energia insuficiente para atacar', 'INSUFFICIENT_ENERGY');
    }

    // Calcular dano
    const playerDamage = Math.max(1, player.attack - Math.floor(Math.random() * monster.defense));
    const monsterDamage = Math.max(1, monster.attack - Math.floor(Math.random() * player.defense));

    // Simular combate
    let playerHealth = player.health;
    let monsterHealth = monster.health;
    let rounds = 0;
    const max_rounds = 10;

    while (playerHealth > 0 && monsterHealth > 0 && rounds < max_rounds) {
      monsterHealth -= playerDamage + Math.floor(Math.random() * 5);

      if (monsterHealth > 0) {
        playerHealth -= monsterDamage + Math.floor(Math.random() * 3);
      }

      rounds++;
    }

    const playerWon = monsterHealth <= 0 && playerHealth > 0;

    if (playerWon) {
      const xpGain = monster.xp_reward;
      const goldGain = monster.gold_reward + Math.floor(Math.random() * 50);
      const dropChance = Math.random();

      // Atualizar jogador
      await query(
        `UPDATE players
         SET gold = gold + $1,
             experience = experience + $2,
             energy = energy - 10,
             health = $3,
             updated_at = NOW(),
             last_action = NOW()
         WHERE id = $4`,
        [goldGain, xpGain, Math.max(1, playerHealth), player_id]
      );

      // Registrar combate
      await query(
        `INSERT INTO action_logs (player_id, action_type, action_data, reward_gold, reward_experience, result, created_at)
         VALUES ($1, 'combat', $2, $3, $4, 'victory', NOW())`,
        [player_id, JSON.stringify({ monster: monster_name, rounds }), goldGain, xpGain]
      );

      logger.info(`Combate vencido: ${player.character_name} vs ${monster_name}`);

      res.status(200).json({
        success: true,
        message: `Você venceu o ${monster_name}!`,
        data: {
          result: 'victory',
          player_health: Math.max(1, playerHealth),
          monster_health: monsterHealth,
          xp_gained: xpGain,
          gold_gained: goldGain,
          item_dropped: dropChance <= monster.drop_chance,
          rare_item_dropped: dropChance <= monster.rare_drop_chance,
          rounds,
        },
        requestId: req.id,
      });
    } else {
      // Derrota
      const healthLeft = Math.max(1, playerHealth);

      await query(
        `UPDATE players
         SET health = $1,
             energy = energy - 10,
             updated_at = NOW(),
             last_action = NOW()
         WHERE id = $2`,
        [healthLeft, player_id]
      );

      logger.info(`Combate perdido: ${player.character_name} vs ${monster_name}`);

      res.status(200).json({
        success: true,
        message: `Você foi derrotado pelo ${monster_name}!`,
        data: {
          result: 'defeat',
          player_health: healthLeft,
          monster_health: Math.max(0, monsterHealth),
          rounds,
        },
        requestId: req.id,
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
