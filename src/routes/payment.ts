import { Router, Request, Response, NextFunction } from 'express';
import {
  getPaymentPackages,
  createMercadoPagoCheckout,
  createStripeCheckout,
  grantGemsAfterPayment,
  recordPaymentTransaction,
  verifyPaymentStatus,
  listPlayerTransactions,
} from '../services/payment';
import { query } from '../database/connection';
import logger from '../config/logger';

const router = Router();

// Listar pacotes disponíveis
router.get('/packages', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: getPaymentPackages(),
    requestId: req.id,
  });
});

// Criar checkout com Mercado Pago
router.post('/mercadopago/checkout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { playerId, packageId } = req.body;

    if (!playerId || !packageId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'playerId e packageId são obrigatórios' },
        requestId: req.id,
      });
    }

    const checkoutData = await createMercadoPagoCheckout(playerId, packageId);

    await recordPaymentTransaction(
      playerId,
      packageId,
      'mercadopago',
      checkoutData.externalReference,
      'pending',
      0
    );

    res.status(200).json({
      success: true,
      data: checkoutData,
      requestId: req.id,
    });
  } catch (error) {
    next(error);
  }
});

// Criar checkout com Stripe
router.post('/stripe/checkout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { playerId, packageId } = req.body;

    if (!playerId || !packageId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'playerId e packageId são obrigatórios' },
        requestId: req.id,
      });
    }

    const checkoutData = await createStripeCheckout(playerId, packageId);

    await recordPaymentTransaction(
      playerId,
      packageId,
      'stripe',
      checkoutData.externalReference,
      'pending',
      0
    );

    res.status(200).json({
      success: true,
      data: checkoutData,
      requestId: req.id,
    });
  } catch (error) {
    next(error);
  }
});

// Webhook Mercado Pago
router.post('/mercadopago/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, type } = req.body;

    if (type === 'payment' && data) {
      logger.info('Webhook Mercado Pago recebido:', data);

      const paymentId = data.id;
      const status = data.status;
      const externalReference = data.external_reference;

      if (status === 'approved' && externalReference) {
        const [playerId, packageId] = externalReference.split(':');

        await recordPaymentTransaction(
          playerId,
          packageId,
          'mercadopago',
          externalReference,
          'approved',
          data.transaction_amount || 0
        );

        await grantGemsAfterPayment(playerId, packageId);

        logger.info(`✅ Pagamento Mercado Pago aprovado: ${externalReference}`);
      }
    }

    res.status(200).json({ success: true, message: 'Webhook processado' });
  } catch (error) {
    logger.error('Erro ao processar webhook Mercado Pago:', error);
    res.status(200).json({ success: true }); // Responder 200 mesmo com erro para não reenviar
  }
});

// Webhook Stripe
router.post('/stripe/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sig = req.headers['stripe-signature'] as string;

    if (!sig) {
      return res.status(400).json({ success: false, error: 'Assinatura Stripe faltando' });
    }

    const stripe = (await import('stripe')).default;
    const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2024-04-10' as any,
    });

    const event = stripeClient.webhooks.constructEvent(
      JSON.stringify(req.body),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const { playerId, packageId } = session.metadata;

      await recordPaymentTransaction(
        playerId,
        packageId,
        'stripe',
        session.id,
        'approved',
        session.amount_total / 100
      );

      await grantGemsAfterPayment(playerId, packageId);

      logger.info(`✅ Pagamento Stripe aprovado: ${session.id}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Erro ao processar webhook Stripe:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
});

// Listar histórico de transações do jogador
router.get('/history/:playerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transactions = await listPlayerTransactions(req.params.playerId);

    res.status(200).json({
      success: true,
      data: transactions,
      requestId: req.id,
    });
  } catch (error) {
    next(error);
  }
});

export default router;