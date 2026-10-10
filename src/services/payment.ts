import axios from 'axios';
import crypto from 'crypto';
import config from '../config/environment';
import logger from '../config/logger';
import { query } from '../database/connection';

export interface PaymentPackage {
  id: string;
  label: string;
  amount: number;
  gems: number;
  currency: string;
}

const packages: PaymentPackage[] = [
  { id: 'starter', label: 'Pacote Starter', amount: 9.99, gems: 100, currency: 'BRL' },
  { id: 'vip', label: 'Pacote VIP', amount: 19.99, gems: 250, currency: 'BRL' },
  { id: 'elite', label: 'Pacote Elite', amount: 49.99, gems: 700, currency: 'BRL' },
  { id: 'legend', label: 'Pacote Legend', amount: 99.99, gems: 1800, currency: 'BRL' },
];

export function getPaymentPackages(): PaymentPackage[] {
  return packages;
}

export function getPaymentPackageById(id: string): PaymentPackage | undefined {
  return packages.find((pkg) => pkg.id === id);
}

export async function createMercadoPagoCheckout(
  playerId: string,
  packageId: string
): Promise<any> {
  const pkg = getPaymentPackageById(packageId);
  if (!pkg) throw new Error('Pacote inválido');

  if (!config.payment.mercadoPagoAccessToken) {
    throw new Error('Mercado Pago não configurado');
  }

  try {
    const response = await axios.post(
      'https://api.mercadopago.com/checkout/preferences',
      {
        items: [
          {
            title: pkg.label,
            quantity: 1,
            unit_price: pkg.amount,
            currency_id: 'BRL',
          },
        ],
        external_reference: `${playerId}:${packageId}`,
        back_urls: {
          success: `${config.apiUrl}/api/payments/mercadopago/success`,
          failure: `${config.apiUrl}/api/payments/mercadopago/failure`,
          pending: `${config.apiUrl}/api/payments/mercadopago/pending`,
        },
        auto_return: 'approved',
      },
      {
        headers: {
          Authorization: `Bearer ${config.payment.mercadoPagoAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    logger.info(`Checkout Mercado Pago criado para ${playerId}`);

    return {
      provider: 'mercadopago',
      checkoutUrl: response.data.init_point,
      paymentId: response.data.id,
      externalReference: `${playerId}:${packageId}`,
    };
  } catch (error) {
    logger.error('Erro ao criar checkout Mercado Pago:', error);
    throw error;
  }
}

export async function createStripeCheckout(playerId: string, packageId: string): Promise<any> {
  const pkg = getPaymentPackageById(packageId);
  if (!pkg) throw new Error('Pacote inválido');

  if (!config.payment.stripeSecretKey) {
    throw new Error('Stripe não configurado');
  }

  try {
    const stripe = (await import('stripe')).default;
    const stripeClient = new stripe(config.payment.stripeSecretKey, {
      apiVersion: '2024-04-10' as any,
    });

    const session = await stripeClient.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: pkg.label,
            },
            unit_amount: Math.round(pkg.amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${config.apiUrl}/api/payments/stripe/success?playerId=${playerId}&packageId=${packageId}`,
      cancel_url: `${config.apiUrl}/api/payments/stripe/failure?playerId=${playerId}&packageId=${packageId}`,
      metadata: { playerId, packageId },
    });

    logger.info(`Checkout Stripe criado para ${playerId}`);

    return {
      provider: 'stripe',
      checkoutUrl: session.url,
      paymentId: session.id,
      externalReference: session.id,
    };
  } catch (error) {
    logger.error('Erro ao criar checkout Stripe:', error);
    throw error;
  }
}

export async function grantGemsAfterPayment(playerId: string, packageId: string): Promise<void> {
  const pkg = getPaymentPackageById(packageId);
  if (!pkg) throw new Error('Pacote inválido');

  try {
    await query(
      `UPDATE players
       SET gems = gems + $1,
           updated_at = NOW()
       WHERE id = $2`,
      [pkg.gems, playerId]
    );

    logger.info(`💎 ${pkg.gems} gemas creditadas para jogador ${playerId}`);
  } catch (error) {
    logger.error('Erro ao creditar gemas:', error);
    throw error;
  }
}

export async function recordPaymentTransaction(
  playerId: string,
  packageId: string,
  provider: string,
  externalReference: string,
  status: string,
  amount: number
): Promise<void> {
  try {
    const pkg = getPaymentPackageById(packageId);

    await query(
      `INSERT INTO payment_transactions (player_id, package_id, provider, external_reference, status, amount, gems_credited, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (external_reference) DO UPDATE SET status = $5, updated_at = NOW()`,
      [
        playerId,
        packageId,
        provider,
        externalReference,
        status,
        amount || pkg?.amount || 0,
        status === 'approved' ? pkg?.gems || 0 : 0,
      ]
    );

    logger.info(
      `Transação registrada: ${provider} - ${externalReference} - ${status}`
    );
  } catch (error) {
    logger.error('Erro ao registrar transação:', error);
    throw error;
  }
}

export async function verifyPaymentStatus(
  externalReference: string,
  provider: string
): Promise<boolean> {
  try {
    const result = await query(
      `SELECT status FROM payment_transactions WHERE external_reference = $1 AND provider = $2`,
      [externalReference, provider]
    );

    if (result.rows.length === 0) return false;
    return result.rows[0].status === 'approved';
  } catch (error) {
    logger.error('Erro ao verificar status de pagamento:', error);
    return false;
  }
}

export async function listPlayerTransactions(playerId: string): Promise<any[]> {
  try {
    const result = await query(
      `SELECT id, package_id, provider, status, amount, gems_credited, created_at, updated_at
       FROM payment_transactions
       WHERE player_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [playerId]
    );

    return result.rows;
  } catch (error) {
    logger.error('Erro ao listar transações:', error);
    throw error;
  }
}