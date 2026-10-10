import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../database/connection';
import { allHunts, ProgressionFormulas } from '../data/hunts.data';
import logger from '../config/logger';
import { AppError } from '../types';

const router = Router();

// Listar todas as hunts disponíveis
router.get('/list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({
      success: true,
      data: allHunts.map((hunt) => ({
        id: hunt.id,
        huntNumber: hunt.huntNumber,
        region: hunt.region,
        name: hunt.name,
        description: hunt.description,
        minLevel: hunt.minLevel,
        recommendedLevel: hunt.recommendedLevel,
        experienceMultiplier: hunt.experienceMultiplier,
        goldMultiplier: hunt.goldMultiplier,
      })),
      total: allHunts.length,
      requestId: req.id,
    });
  } catch (error) {
    next(error);
  }
});

// Obter detalhes de uma hunt específica
router.get('/:huntId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hunt = allHunts.find((h) => h.id === req.params.huntId);

    if (!hunt) {
      throw new AppError(404, 'Hunt não encontrada', 'HUNT_NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      data: hunt,
      requestId: req.id,
    });
  } catch (error) {
    next(error);
  }
});

// Iniciar caça em uma hunt
router.post('/:huntId/hunt', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Autenticação necessária', 'UNAUTHORIZED');
    }

    const { playerId, quantity = 1 } = req.body;

    if (!playerId) {
      throw new AppError(400, 'playerId é obrigatório', 'MISSING_PLAYER_ID');
    }

    const hunt = allHunts.find((h) => h.id === req.params.huntId);
    if (!hunt) {
      throw new AppError(404, 'Hunt não encontrada', 'HUNT_NOT_FOUND');
    }

    const playerResult = await query(
      `SELECT * FROM players WHERE id = $1 AND user_id = $2`,
      [playerId, req.userId]
    );

    if (playerResult.rows.length === 0) {
      throw new AppError(404, 'Jogador não encontrado', 'PLAYER_NOT_FOUND');
    }

    const player = playerResult.rows[0];

    if (player.level < hunt.minLevel) {
      throw new AppError(
        400,
        `Nível mínimo necessário: ${hunt.minLevel}`,
        'LEVEL_REQUIREMENT_NOT_MET'
      );
    }

    // Simular caça contra monstros aleatórios
    let totalXp = 0;
    let totalGold = 0;
    const loot: any[] = [];

    for (let i = 0; i < quantity; i++) {
      const monster = hunt.monsters[Math.floor(Math.random() * hunt.monsters.length)];

      // Calcular XP e ouro com multiplicadores
      const xpGain = Math.floor(
        monster.experienceReward * hunt.experienceMultiplier * (1 + player.level * 0.01)
      );
      const goldGain = Math.floor(
        monster.goldReward * hunt.goldMultiplier * (1 + player.level * 0.005)
      );

      totalXp += xpGain;
      totalGold += goldGain;

      // Chance de loot
      for (const lootTable of hunt.lootTables) {
        if (Math.random() < lootTable.dropChance) {
          const quantity = Math.floor(
            Math.random() * (lootTable.quantity.max - lootTable.quantity.min + 1) +
              lootTable.quantity.min
          );
          loot.push({ name: lootTable.name, rarity: lootTable.rarity, quantity });
        }
      }
    }

    // Atualizar progresso do jogador
    const newExperience = player.experience + totalXp;
    const experienceForNextLevel = ProgressionFormulas.experienceForLevel(player.level);
    const newLevel =
      player.level + Math.floor(newExperience / experienceForNextLevel);

    await query(
      `UPDATE players
       SET experience = experience + $1,
           gold = gold + $2,
           level = $3,
           total_harvested = total_harvested + $4,
           updated_at = NOW(),
           last_action = NOW()
       WHERE id = $5`,
      [totalXp, totalGold, newLevel, quantity, playerId]
    );

    // Registrar ação
    await query(
      `INSERT INTO action_logs (player_id, action_type, action_data, reward_gold, reward_experience, result, created_at)
       VALUES ($1, 'hunt', $2, $3, $4, 'success', NOW())`,
      [
        playerId,
        JSON.stringify({ hunt: hunt.name, monstersDefeated: quantity }),
        totalGold,
        totalXp,
      ]
    );

    logger.info(
      `Jogador ${playerId} completou ${quantity} kills na hunt ${hunt.name}: +${totalXp} XP +${totalGold} ouro`
    );

    res.status(200).json({
      success: true,
      data: {
        experienceGained: totalXp,
        goldGained: totalGold,
        levelUp: newLevel > player.level,
        newLevel: newLevel,
        loot: loot,
      },
      message: `Caça concluída! +${totalXp} XP +${totalGold} ouro`,
      requestId: req.id,
    });
  } catch (error) {
    next(error);
  }
});

// Obter estatísticas de hunts
router.get('/:playerId/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Autenticação necessária', 'UNAUTHORIZED');
    }

    const statsResult = await query(
      `SELECT 
        COUNT(*) as total_hunts,
        SUM(CASE WHEN action_type = 'hunt' THEN 1 ELSE 0 END) as hunts_completed,
        SUM(reward_experience) as total_experience,
        SUM(reward_gold) as total_gold,
        AVG(EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (ORDER BY created_at)))) as avg_time_per_hunt
       FROM action_logs
       WHERE player_id = $1 AND action_type = 'hunt'
       AND created_at > NOW() - INTERVAL '24 hours'`,
      [req.params.playerId]
    );

    res.status(200).json({
      success: true,
      data: statsResult.rows[0] || {
        total_hunts: 0,
        hunts_completed: 0,
        total_experience: 0,
        total_gold: 0,
        avg_time_per_hunt: 0,
      },
      requestId: req.id,
    });
  } catch (error) {
    next(error);
  }
});

export default router;