import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../database/connection';
import config from '../config/environment';
import logger from '../config/logger';
import { AppError, ProgressionFormulas } from '../config/hunts.types';

const router = Router();

// Caça offline - calcular ganhos enquanto offline
router.post('/:playerId/claim-offline', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Autenticação necessária', 'UNAUTHORIZED');
    }

    const { lastHuntId } = req.body;

    const playerResult = await query(
      `SELECT * FROM players WHERE id = $1 AND user_id = $2`,
      [req.params.playerId, req.userId]
    );

    if (playerResult.rows.length === 0) {
      throw new AppError(404, 'Jogador não encontrado', 'PLAYER_NOT_FOUND');
    }

    const player = playerResult.rows[0];
    const now = new Date();
    const lastAction = new Date(player.last_action);
    const timeOfflineMinutes = (now.getTime() - lastAction.getTime()) / (1000 * 60);

    if (timeOfflineMinutes < 1) {
      return res.status(200).json({
        success: true,
        data: { experience: 0, gold: 0 },
        message: 'Tempo insuficiente para ganhar offline',
        requestId: req.id,
      });
    }

    const offlineEarnings = ProgressionFormulas.calculateOfflineEarnings(
      lastHuntId || 'hunt_001',
      timeOfflineMinutes,
      player.level * 10 // Poder do player
    );

    // Validar se o ganho é realista
    const isValid = ProgressionFormulas.validateEarnings(
      player.level * 10,
      timeOfflineMinutes,
      offlineEarnings.experience,
      offlineEarnings.gold
    );

    if (!isValid) {
      throw new AppError(400, 'Ganho offline suspeito - possível exploit', 'SUSPICIOUS_OFFLINE_EARNINGS');
    }

    // Atualizar jogador
    await query(
      `UPDATE players
       SET experience = experience + $1,
           gold = gold + $2,
           last_action = NOW(),
           updated_at = NOW()
       WHERE id = $3`,
      [offlineEarnings.experience, offlineEarnings.gold, req.params.playerId]
    );

    logger.info(
      `Ganhos offline reivindicados: +${offlineEarnings.experience} XP +${offlineEarnings.gold} ouro (${timeOfflineMinutes.toFixed(1)} min)`
    );

    res.status(200).json({
      success: true,
      data: {
        experience: offlineEarnings.experience,
        gold: offlineEarnings.gold,
        timeOfflineMinutes: timeOfflineMinutes.toFixed(1),
      },
      message: `Ganhos offline reclamados! +${offlineEarnings.experience} XP +${offlineEarnings.gold} ouro`,
      requestId: req.id,
    });
  } catch (error) {
    next(error);
  }
});

// Obter andares infinitos
router.get('/infinite/floor/:floorNumber', (req: Request, res: Response) => {
  try {
    const floorNumber = parseInt(req.params.floorNumber, 10);

    if (isNaN(floorNumber) || floorNumber < 1) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_FLOOR', message: 'Número de andar inválido' },
        requestId: req.id,
      });
    }

    const floorStats = ProgressionFormulas.infiniteFloorStats(floorNumber);

    res.status(200).json({
      success: true,
      data: floorStats,
      requestId: req.id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Erro ao obter andar infinito' },
      requestId: req.id,
    });
  }
});

export default router;