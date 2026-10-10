import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../database/connection';
import config from '../config/environment';

const router = Router();

router.get('/status/:playerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const playerResult = await query(
      `SELECT * FROM players WHERE id = $1 AND user_id = $2`,
      [req.params.playerId, req.userId]
    );

    if (playerResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'PLAYER_NOT_FOUND', message: 'Jogador não encontrado' } });
    }

    const player = playerResult.rows[0];
    const inventoryResult = await query(
      `SELECT pi.*, it.name AS item_name, it.type AS item_type
       FROM player_inventory pi
       JOIN item_types it ON it.id = pi.item_type_id
       WHERE pi.player_id = $1`,
      [player.id]
    );

    const nextLevelExp = Math.floor(100 * Math.pow(1.3, player.level - 1));

    res.status(200).json({
      success: true,
      data: {
        player,
        inventory: inventoryResult.rows,
        nextLevelExp,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/harvest', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { playerId } = req.body;
    const playerResult = await query(
      `SELECT * FROM players WHERE id = $1 AND user_id = $2`,
      [playerId, req.userId]
    );

    if (playerResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'PLAYER_NOT_FOUND', message: 'Jogador não encontrado' } });
    }

    const player = playerResult.rows[0];
    const bonusGold = Math.floor(Math.random() * (config.game.harvest.maxGold - config.game.harvest.baseGold + 1)) + config.game.harvest.baseGold;
    const bonusXp = 25;

    await query(
      `UPDATE players
       SET gold = gold + $1,
           experience = experience + $2,
           total_harvested = total_harvested + $1,
           updated_at = NOW(),
           last_action = NOW()
       WHERE id = $3`,
      [bonusGold, bonusXp, player.id]
    );

    await query(
      `INSERT INTO action_logs (player_id, action_type, action_data, reward_gold, reward_experience, result, created_at)
       VALUES ($1, 'harvest', $2, $3, $4, 'success', NOW())`,
      [player.id, JSON.stringify({ source: 'manual' }), bonusGold, bonusXp]
    );

    res.status(200).json({
      success: true,
      message: 'Colheita concluída',
      data: { goldReward: bonusGold, experienceReward: bonusXp },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/attack', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { playerId } = req.body;
    const playerResult = await query(
      `SELECT * FROM players WHERE id = $1 AND user_id = $2`,
      [playerId, req.userId]
    );

    if (playerResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'PLAYER_NOT_FOUND', message: 'Jogador não encontrado' } });
    }

    const player = playerResult.rows[0];

    if (player.energy < config.game.attack.costEnergy) {
      return res.status(400).json({ success: false, error: { code: 'NOT_ENOUGH_ENERGY', message: 'Energia insuficiente' } });
    }

    const damage = Math.floor(Math.random() * (config.game.attack.maxDamage - config.game.attack.baseDamage + 1)) + config.game.attack.baseDamage;
    const goldReward = Math.floor(Math.random() * (config.game.attack.maxGold - config.game.attack.baseGold + 1)) + config.game.attack.baseGold;
    const experienceReward = 50;

    await query(
      `UPDATE players
       SET energy = energy - $1,
           gold = gold + $2,
           experience = experience + $3,
           total_damage_dealt = total_damage_dealt + $4,
           updated_at = NOW(),
           last_action = NOW()
       WHERE id = $5`,
      [config.game.attack.costEnergy, goldReward, experienceReward, damage, player.id]
    );

    await query(
      `INSERT INTO action_logs (player_id, action_type, action_data, reward_gold, reward_experience, result, created_at)
       VALUES ($1, 'attack', $2, $3, $4, 'success', NOW())`,
      [player.id, JSON.stringify({ damage }), goldReward, experienceReward]
    );

    res.status(200).json({
      success: true,
      message: 'Ataque realizado',
      data: { damage, goldReward, experienceReward },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
