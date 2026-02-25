/* eslint-disable no-await-in-loop */
import { format } from 'date-fns';
import type { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import prisma from '@/config/prisma/prisma';
import { I18nService } from '@/services/I18nService';
import { DeliveryFeeService, type DeliveryInfo } from '@/services/delivery/DeliveryFeeService';
import logger from '@/services/logging/logger';
import type { MobilePaymentProvider } from '@/services/payment/MobilePaymentService';
import { MobilePaymentService } from '@/services/payment/MobilePaymentService';
import type { AuthenticatedRequest } from '@/types/express';
import { asyncHandler, response } from '@/utils/responses/helpers';

// Instance du service i18n
const i18n = new I18nService();

//& Générer un numéro de commande unique
const generateOrderNumber = (): string => {
  const date = format(new Date(), 'yyyyMM');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `CMD-${date}-${random}`;
};

//& Créer des commandes à partir du panier
const createOrdersFromCart = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void | Response<any>> => {
    const userId = req.user?.user_id;
    const { deliveryAddress, deliveryType, paymentMethod, phoneNumber } = req.body;
    const lang = i18n.detectLanguage(req.headers['accept-language']);

    if (!userId) {
      return response.unauthorized(req, res, i18n.translate('auth.user_not_authenticated', lang));
    }

    // Récupérer le panier avec les items
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                farm: {
                  select: {
                    id: true,
                    name: true,
                    payoutMethod: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return response.badRequest(req, res, i18n.translate('orders.cart_empty', lang));
    }

    // Vérifier le stock pour chaque produit
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return response.badRequest(
          req,
          res,
          i18n.translate('orders.stock_insufficient', lang, {
            product: item.product.name,
            stock: item.product.stock.toString(),
          }),
        );
      }
    }

    // Grouper les items par ferme
    const itemsByFarm = cart.items.reduce(
      (acc, item) => {
        const farmId = item.product.farmId;
        if (!acc[farmId]) {
          acc[farmId] = {
            farm: item.product.farm,
            items: [],
            totalAmount: 0,
          };
        }
        acc[farmId].items.push(item);
        acc[farmId].totalAmount += item.subtotal;
        return acc;
      },
      {} as Record<string, { farm: any; items: typeof cart.items; totalAmount: number }>,
    );

    // Créer une commande par ferme
    const createdOrders = [];
    const transactionRef = `TXN-${uuidv4().split('-')[0].toUpperCase()}`;

    for (const [_farmId, farmData] of Object.entries(itemsByFarm)) {
      const { farm, items, totalAmount } = farmData;

      // Calculer les frais de livraison (sans poids pour l'instant)
      const totalWeight = 0; // TODO: Ajouter le poids au modèle Product

      const deliveryInfo: DeliveryInfo = {
        farmAddress: farm.address,
        deliveryAddress: deliveryAddress,
        deliveryType: deliveryType,
        totalWeight,
        itemsCount: items.length,
      };

      const deliveryFee = DeliveryFeeService.calculateDeliveryFee(deliveryInfo);

      // Créer la commande
      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          status: 'PENDING',
          totalAmount,
          consumerId: userId,
          farmId: farm.id,
          cartSnapshot: {
            items: items.map((item) => ({
              productId: item.productId,
              name: item.product.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
              farmName: farm.name,
            })),
            totalAmount,
          },
          items: {
            create: items.map((item) => ({
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
              productId: item.productId,
            })),
          },
          delivery: {
            create: {
              type: deliveryType || 'DELIVERY',
              status: 'PENDING',
              pickupAddress: deliveryAddress,
              deliveryFee: deliveryFee,
            },
          },
          payment: {
            create: {
              amount: totalAmount,
              method: paymentMethod || 'ORANGE_MONEY',
              status: 'PENDING',
              phoneNumber: phoneNumber || '',
              transactionRef: `${transactionRef}-${farm.id.slice(-4)}`,
              userId,
            },
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                },
              },
            },
          },
          farm: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          delivery: true,
          payment: true,
        },
      });

      // Mettre à jour le stock des produits en parallèle
      await Promise.all(
        items.map((item) =>
          prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          }),
        ),
      );

      createdOrders.push(order);
    }

    // Initier les paiements pour toutes les commandes
    const paymentResults = [];
    for (const order of createdOrders) {
      try {
        const paymentRequest = {
          amount: order.totalAmount,
          phoneNumber: phoneNumber.replace(/\s+/g, '').replace(/[+\-()]/g, ''),
          provider: paymentMethod as MobilePaymentProvider,
          transactionRef: order.payment?.transactionRef || order.orderNumber,
          description: `Paiement commande ${order.orderNumber}`,
          callbackUrl: `${process.env.APP_URL}/api/v1/payments/callback/${order.id}`,
        };

        // Valider le numéro de téléphone
        if (
          !MobilePaymentService.validatePhoneNumber(
            paymentRequest.phoneNumber,
            paymentRequest.provider,
          )
        ) {
          logger.warn('Numéro de téléphone invalide pour le paiement', {
            phoneNumber: paymentRequest.phoneNumber,
            provider: paymentRequest.provider,
            orderId: order.id,
          });
          paymentResults.push({
            orderId: order.id,
            success: false,
            message: i18n.translate('payments.phone_invalid_for_provider', lang),
          });
          continue;
        }

        const paymentResult = await MobilePaymentService.initiatePayment(paymentRequest);

        if (paymentResult.success) {
          // Mettre à jour le paiement en base de données
          await prisma.mobilePayment.update({
            where: { orderId: order.id },
            data: {
              status: paymentResult.status as any,
              providerRef: paymentResult.transactionId,
            },
          });

          // Mettre à jour l'objet payment dans createdOrders pour la réponse
          order.payment = {
            ...order.payment,
            status: paymentResult.status as any,
            providerRef: paymentResult.transactionId,
          } as any;
        }

        paymentResults.push({
          orderId: order.id,
          ...paymentResult,
        });
      } catch (error) {
        logger.error("Erreur lors de l'initiation du paiement pour la commande", {
          error: error instanceof Error ? error.message : String(error),
          orderId: order.id,
        });
        paymentResults.push({
          orderId: order.id,
          success: false,
          message: i18n.translate('payments.payment_init_error', lang),
        });
      }
    }

    // Vider le panier
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        totalItems: 0,
        totalAmount: 0,
      },
    });

    return response.created(
      req,
      res,
      {
        orders: createdOrders,
        totalOrders: createdOrders.length,
        globalTotal: createdOrders.reduce((sum, o) => sum + o.totalAmount, 0),
        payments: paymentResults,
      },
      i18n.translate('orders.created', lang),
    );
  },
);

//& Récupérer les commandes de l'utilisateur
const getUserOrders = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void | Response<any>> => {
    const userId = req.user?.user_id;
    const { status, page = '1', limit = '10' } = req.query;
    const lang = i18n.detectLanguage(req.headers['accept-language']);

    if (!userId) {
      return response.unauthorized(req, res, i18n.translate('auth.user_not_authenticated', lang));
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { consumerId: userId };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                },
              },
            },
          },
          farm: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          delivery: {
            select: {
              status: true,
              type: true,
              trackingCode: true,
            },
          },
          payment: {
            select: {
              status: true,
              method: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return response.success(
      req,
      res,
      {
        orders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      i18n.translate('orders.retrieved', lang),
    );
  },
);

//& Récupérer une commande par ID
const getOrderById = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void | Response<any>> => {
    const userId = req.user?.user_id;
    const { orderId } = req.params;
    const lang = i18n.detectLanguage(req.headers['accept-language']);

    if (!userId) {
      return response.unauthorized(req, res, i18n.translate('auth.user_not_authenticated', lang));
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        consumerId: userId,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                unit: true,
              },
            },
          },
        },
        farm: {
          select: {
            id: true,
            name: true,
            address: true,
            payoutNumber: true,
          },
        },
        delivery: true,
        payment: true,
        messages: {
          take: 5,
          orderBy: { sentAt: 'desc' },
          include: {
            sender: {
              select: {
                fullname: true,
                avatar_url: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return response.notFound(req, res, i18n.translate('orders.not_found', lang));
    }

    return response.success(req, res, order, i18n.translate('orders.retrieved_single', lang));
  },
);

//& Annuler une commande
const cancelOrder = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void | Response<any>> => {
    const userId = req.user?.user_id;
    const { orderId } = req.params;
    const { reason } = req.body;
    const lang = i18n.detectLanguage(req.headers['accept-language']);

    if (!userId) {
      return response.unauthorized(req, res, i18n.translate('auth.user_not_authenticated', lang));
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        consumerId: userId,
      },
      include: {
        items: true,
        payment: true,
      },
    });

    if (!order) {
      return response.notFound(req, res, i18n.translate('orders.not_found', lang));
    }

    // Vérifier si la commande peut être annulée
    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      return response.badRequest(req, res, i18n.translate('orders.cannot_cancel', lang));
    }

    // Vérifier si le paiement n'est pas déjà complété
    if (order.payment?.status === 'COMPLETED') {
      return response.badRequest(req, res, i18n.translate('orders.already_paid', lang));
    }

    // Annuler la commande
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cartSnapshot: {
          ...(order.cartSnapshot as object),
          cancellationReason: reason || 'Annulée par le client',
          cancelledAt: new Date().toISOString(),
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
          },
        },
        farm: {
          select: {
            id: true,
            name: true,
          },
        },
        delivery: true,
        payment: true,
      },
    });

    // Remettre le stock en parallèle
    await Promise.all(
      order.items.map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        }),
      ),
    );

    return response.success(req, res, updatedOrder, i18n.translate('orders.cancelled', lang));
  },
);

//& Récupérer les commandes par ferme (pour les agriculteurs)
const getFarmOrders = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void | Response<any>> => {
    const userId = req.user?.user_id;
    const { status, page = '1', limit = '10' } = req.query;
    const lang = i18n.detectLanguage(req.headers['accept-language']);

    if (!userId) {
      return response.unauthorized(req, res, i18n.translate('auth.user_not_authenticated', lang));
    }

    // Vérifier que l'utilisateur est un agriculteur
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      include: { farm: true },
    });

    if (!user?.farm) {
      return response.forbidden(req, res, i18n.translate('orders.farmers_only', lang));
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { farmId: user.farm.id };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                },
              },
            },
          },
          consumer: {
            select: {
              user_id: true,
              fullname: true,
            },
          },
          delivery: true,
          payment: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    return response.success(
      req,
      res,
      {
        orders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      i18n.translate('orders.farm_orders_retrieved', lang),
    );
  },
);

//& Mettre à jour le statut d'une commande (pour les agriculteurs)
const updateOrderStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void | Response<any>> => {
    const userId = req.user?.user_id;
    const { orderId } = req.params;
    const { status, deliveryDate } = req.body;
    const lang = i18n.detectLanguage(req.headers['accept-language']);

    if (!userId) {
      return response.unauthorized(req, res, i18n.translate('auth.user_not_authenticated', lang));
    }

    // Vérifier que l'utilisateur est un agriculteur
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      include: { farm: true },
    });

    if (!user?.farm) {
      return response.forbidden(req, res, i18n.translate('orders.farmers_only', lang));
    }

    // Vérifier que la commande appartient à la ferme
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        farmId: user.farm.id,
      },
    });

    if (!order) {
      return response.notFound(req, res, 'Commande non trouvée');
    }

    const updateData: any = { status };
    if (deliveryDate) {
      updateData.deliveryDate = new Date(deliveryDate);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        consumer: {
          select: {
            fullname: true,
          },
        },
        delivery: true,
      },
    });

    return response.success(req, res, updatedOrder, i18n.translate('orders.status_updated', lang));
  },
);

//& Obtenir le tracking timeline d'une commande
const getOrderTracking = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void | Response<any>> => {
    const userId = req.user?.user_id;
    const { orderId } = req.params;
    const lang = i18n.detectLanguage(req.headers['accept-language']);

    if (!userId) {
      return response.unauthorized(req, res, i18n.translate('auth.user_not_authenticated', lang));
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        OR: [{ consumerId: userId }, { farm: { farmerId: userId } }],
      },
      include: {
        delivery: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return response.notFound(req, res, 'Commande non trouvée');
    }

    // Construire la timeline
    const timeline = [
      {
        status: 'PLACED',
        label: 'Commande passée',
        date: order.createdAt,
        completed: true,
      },
      {
        status: 'CONFIRMED',
        label: 'Commande confirmée',
        date: order.status !== 'PENDING' ? order.updatedAt : null,
        completed: ['CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'].includes(order.status),
      },
      {
        status: 'PREPARING',
        label: 'En préparation',
        date: ['PREPARING', 'READY', 'DELIVERED'].includes(order.status) ? order.updatedAt : null,
        completed: ['PREPARING', 'READY', 'DELIVERED'].includes(order.status),
      },
      {
        status: 'READY',
        label: 'Prête pour livraison',
        date: ['READY', 'DELIVERED'].includes(order.status) ? order.updatedAt : null,
        completed: ['READY', 'DELIVERED'].includes(order.status),
      },
      {
        status: 'DELIVERED',
        label: 'Livrée',
        date: order.status === 'DELIVERED' ? order.deliveryDate || order.updatedAt : null,
        completed: order.status === 'DELIVERED',
      },
    ];

    return response.success(
      req,
      res,
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        timeline,
        delivery: order.delivery,
        items: order.items,
      },
      i18n.translate('orders.tracking_retrieved', lang),
    );
  },
);

//& Générer le QR code et token de confirmation pour la livraison
const generateDeliveryConfirmation = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void | Response<any>> => {
    const userId = req.user?.user_id;
    const { orderId } = req.params;
    const lang = i18n.detectLanguage(req.headers['accept-language']);

    if (!userId) {
      return response.unauthorized(req, res, i18n.translate('auth.user_not_authenticated', lang));
    }

    // Vérifier que l'utilisateur est un agriculteur
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      include: { farm: true },
    });

    if (!user?.farm) {
      return response.forbidden(req, res, i18n.translate('orders.farmers_only', lang));
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        farmId: user.farm.id,
        status: { in: ['PREPARING', 'READY'] },
      },
      include: { delivery: true },
    });

    if (!order) {
      return response.notFound(req, res, i18n.translate('orders.not_ready_for_delivery', lang));
    }

    // Générer un token de confirmation
    const confirmationToken = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Mettre à jour la livraison avec le token
    await prisma.delivery.update({
      where: { orderId },
      data: {
        trackingCode: confirmationToken,
        status: 'IN_TRANSIT',
      },
    });

    // Générer la donnée pour QR code (à encoder côté client ou avec une lib)
    const qrData = JSON.stringify({
      orderId: order.id,
      orderNumber: order.orderNumber,
      token: confirmationToken,
      farmId: user.farm.id,
    });

    return response.success(
      req,
      res,
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        confirmationToken,
        qrData,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expire après 24h
      },
      i18n.translate('orders.confirmation_generated', lang),
    );
  },
);

//& Confirmer la réception d'une commande (par token ou QR code)
const confirmDelivery = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void | Response<any>> => {
    const userId = req.user?.user_id;
    const { orderId } = req.params;
    const { token, qrData } = req.body;
    const lang = i18n.detectLanguage(req.headers['accept-language']);

    if (!userId) {
      return response.unauthorized(req, res, i18n.translate('auth.user_not_authenticated', lang));
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        consumerId: userId,
      },
      include: { delivery: true },
    });

    if (!order) {
      return response.notFound(req, res, i18n.translate('orders.not_found', lang));
    }

    if (order.status === 'DELIVERED') {
      return response.badRequest(req, res, i18n.translate('orders.already_delivered', lang));
    }

    // Vérifier le token ou les données QR
    let isValid = false;
    if (token && order.delivery?.trackingCode === token.toUpperCase()) {
      isValid = true;
    } else if (qrData) {
      try {
        const parsed = JSON.parse(qrData);
        if (parsed.orderId === orderId && parsed.token === order.delivery?.trackingCode) {
          isValid = true;
        }
      } catch {
        isValid = false;
      }
    }

    if (!isValid) {
      return response.badRequest(req, res, i18n.translate('orders.invalid_token', lang));
    }

    // Mettre à jour la commande et la livraison
    const [updatedOrder] = await Promise.all([
      prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'DELIVERED',
          deliveryDate: new Date(),
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                },
              },
            },
          },
          farm: {
            select: {
              id: true,
              name: true,
            },
          },
          delivery: true,
        },
      }),
      prisma.delivery.update({
        where: { orderId },
        data: {
          status: 'DELIVERED',
        },
      }),
    ]);

    return response.success(
      req,
      res,
      updatedOrder,
      i18n.translate('orders.delivery_confirmed', lang),
    );
  },
);

export default {
  createOrdersFromCart,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getFarmOrders,
  updateOrderStatus,
  getOrderTracking,
  generateDeliveryConfirmation,
  confirmDelivery,
};
