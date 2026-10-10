import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../database/connection';
import logger from '../config/logger';
import { AppError } from '../types';

const router = Router();

// GET: Obter inventário do personagem
router.get('/:playerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Autenticação necessária', 'UNAUTHORIZED');
    }

    // Verificar se o personagem pertence ao usuário
    const playerCheck = await query(
      `SELECT id FROM players WHERE id = $1 AND user_id = $2`,
      [req.params.playerId, req.userId]
    );

    if (playerCheck.rows.length === 0) {
      throw new AppError(404, 'Personagem não encontrado', 'PLAYER_NOT_FOUND');
    }

    // Buscar inventário
    const result = await query(
      `SELECT pi.id, pi.item_id, pi.quantity, pi.equipped, i.name, i.type, i.rarity, i.attack_bonus, i.defense_bonus, i.health_bonus
       FROM player_inventory pi
       JOIN items i ON i.id = pi.item_id
       WHERE pi.player_id = $1
       ORDER BY i.rarity DESC, i.name ASC`,
      [req.params.playerId]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
      total_items: result.rows.length,
      requestId: req.id,
    });
  } catch (error) {
    next(error);
  }
});

// POST: Equipar item
router.post('/:playerId/equip', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Autenticação necessária', 'UNAUTHORIZED');
    }

    const { inventory_id } = req.body;

    if (!inventory_id) {
      throw new AppError(400, 'ID do item é obrigatório', 'MISSING_INVENTORY_ID');
    }

    // Verificar se o personagem pertence ao usuário e se o item existe
    const checkResult = await query(
      `SELECT pi.id, pi.item_id, i.type
       FROM player_inventory pi
       JOIN items i ON i.id = pi.item_id
       WHERE pi.id = $1 AND pi.player_id = $2`,
      [inventory_id, req.params.playerId]
    );

    if (checkResult.rows.length === 0) {
      throw new AppError(404, 'Item não encontrado', 'ITEM_NOT_FOUND');
    }

    const itemType = checkResult.rows[0].type;

    // Se o item é equipamento, desequipar outros do mesmo tipo
    if (itemType === 'EQUIPMENT') {
      await query(
        `UPDATE player_inventory SET equipped = false
         WHERE player_id = $1 AND item_id IN (
           SELECT id FROM items WHERE type = 'EQUIPMENT'
         ) AND id != $2`,
        [req.params.playerId, inventory_id]
      );
    }

    // Equipar o item
    const result = await query(
      `UPDATE player_inventory SET equipped = true WHERE id = $1 RETURNING *`,
      [inventory_id]
    );

    logger.info(`Item equipado para personagem ${req.params.playerId}`);

    res.status(200).json({
      success: true,
      message: 'Item equipado com sucesso',
      data: result.rows[0],
      requestId: req.id,
    });
  } catch (error) {
    next(error);
  }
});

// POST: Desequipar item
router.post('/:playerId/unequip', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Autenticação necessária', 'UNAUTHORIZED');
    }

    const { inventory_id } = req.body;

    if (!inventory_id) {
      throw new AppError(400, 'ID do item é obrigatório', 'MISSING_INVENTORY_ID');
    }

    // Verificar se o item existe e pertence ao personagem
    const checkResult = await query(
      `SELECT pi.id FROM player_inventory pi
       WHERE pi.id = $1 AND pi.player_id = $2`,
      [inventory_id, req.params.playerId]
    );

    if (checkResult.rows.length === 0) {
      throw new AppError(404, 'Item não encontrado', 'ITEM_NOT_FOUND');
    }

    // Desequipar o item
    const result = await query(
      `UPDATE player_inventory SET equipped = false WHERE id = $1 RETURNING *`,
      [inventory_id]
    );

    logger.info(`Item desequipado do personagem ${req.params.playerId}`);

    res.status(200).json({
      success: true,
      message: 'Item desequipado com sucesso',
      data: result.rows[0],
      requestId: req.id,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE: Deletar item do inventário
router.delete('/:playerId/:inventoryId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Autenticação necessária', 'UNAUTHORIZED');
    }

    // Verificar se o item pertence ao personagem
    const checkResult = await query(
      `SELECT id FROM player_inventory
       WHERE id = $1 AND player_id = $2`,
      [req.params.inventoryId, req.params.playerId]
    );

    if (checkResult.rows.length === 0) {
      throw new AppError(404, 'Item não encontrado', 'ITEM_NOT_FOUND');
    }

    // Deletar o item
    await query(
      `DELETE FROM player_inventory WHERE id = $1`,
      [req.params.inventoryId]
    );

    logger.info(`Item deletado do inventário do personagem ${req.params.playerId}`);

    res.status(200).json({
      success: true,
      message: 'Item deletado com sucesso',
      requestId: req.id,
    });
  } catch (error) {
    next(error);
  }
});

// GET: Obter itens equipados do personagem
router.get('/:playerId/equipped', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new AppError(401, 'Autenticação necessária', 'UNAUTHORIZED');
    }

    // Verificar se o personagem pertence ao usuário
    const playerCheck = await query(
      `SELECT id FROM players WHERE id = $1 AND user_id = $2`,
      [req.params.playerId, req.userId]
    );

    if (playerCheck.rows.length === 0) {
      throw new AppError(404, 'Personagem não encontrado', 'PLAYER_NOT_FOUND');
    }

    // Buscar itens equipados
    const result = await query(
      `SELECT pi.id, pi.item_id, pi.quantity, i.name, i.type, i.rarity, i.attack_bonus, i.defense_bonus, i.health_bonus
       FROM player_inventory pi
       JOIN items i ON i.id = pi.item_id
       WHERE pi.player_id = $1 AND pi.equipped = true
       ORDER BY i.type ASC`,
      [req.params.playerId]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
      total_equipped: result.rows.length,
      requestId: req.id,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
