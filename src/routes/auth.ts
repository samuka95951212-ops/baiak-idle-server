import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../database/connection';
import config from '../config/environment';
import logger from '../config/logger';
import { AppError } from '../types';

const router = Router();

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
      throw new AppError(400, 'Usuário, email e senha são obrigatórios', 'MISSING_FIELDS');
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const result = await query(
      `INSERT INTO users (username, email, password_hash, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, true, NOW(), NOW()) RETURNING id, username, email, created_at`,
      [String(username).trim(), String(email).trim(), passwordHash]
    );

    logger.info(`Novo usuário registrado: ${username}`);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Usuário criado com sucesso',
      requestId: req.id,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      throw new AppError(400, 'Usuário e senha são obrigatórios', 'MISSING_FIELDS');
    }

    const result = await query(
      `SELECT id, username, email, password_hash FROM users WHERE username = $1 AND is_active = true`,
      [String(username).trim()]
    );

    if (result.rows.length === 0) {
      throw new AppError(401, 'Credenciais inválidas', 'INVALID_CREDENTIALS');
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(String(password), user.password_hash);

    if (!isPasswordValid) {
      throw new AppError(401, 'Credenciais inválidas', 'INVALID_CREDENTIALS');
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, config.jwt.secret, {
      expiresIn: config.jwt.expiration,
    });

    await query(
      `UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1`,
      [user.id]
    );

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        expiresIn: config.jwt.expiration,
      },
      requestId: req.id,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
