import { addDays } from 'date-fns';
import type { Response } from 'express';

import prisma from '@/config/prisma/prisma';
import { I18nService } from '@/services/I18nService';
import type { AuthenticatedRequest } from '@/types/express';
import { asyncHandler, response } from '@/utils/responses/helpers';

// Instance du service i18n
const i18n = new I18nService();

//& Récupérer ou créer le panier de l'utilisateur
const getOrCreateCart = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void | Response<any>> => {
    const userId = req.user?.user_id;
    const lang = i18n.detectLanguage(req.headers['accept-language']);

    if (!userId) {
      return response.unauthorized(req, res, i18n.translate('auth.user_not_authenticated', lang));
    }

    let cart = await prisma.cart.findUnique({
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
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
          expiresAt: addDays(new Date(), 7),
          totalItems: 0,
          totalAmount: 0,
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  farm: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    return response.success(req, res, cart, i18n.translate('cart.retrieved', lang));
  },
);

//& Ajouter un item au panier
const addItemToCart = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void | Response<any>> => {
    const userId = req.user?.user_id;
    const { productId, quantity, notes } = req.body;
    const lang = i18n.detectLanguage(req.headers['accept-language']);

    if (!userId) {
      return response.unauthorized(req, res, i18n.translate('auth.user_not_authenticated', lang));
    }

    if (!productId || !quantity || quantity < 1) {
      return response.badRequest(req, res, i18n.translate('cart.product_quantity_required', lang));
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { farm: { select: { id: true, name: true } } },
    });

    if (!product) {
      return response.notFound(req, res, i18n.translate('cart.product_not_found', lang));
    }

    if (!product.isAvailable || product.stock < quantity) {
      return response.badRequest(req, res, i18n.translate('cart.product_unavailable', lang));
    }

    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
          expiresAt: addDays(new Date(), 7),
          totalItems: 0,
          totalAmount: 0,
        },
      });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    const unitPrice = product.price;

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (product.stock < newQuantity) {
        return response.badRequest(req, res, i18n.translate('cart.stock_insufficient', lang));
      }

      const _cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          subtotal: newQuantity * unitPrice,
          notes: notes || existingItem.notes,
        },
        include: { product: { include: { farm: { select: { id: true, name: true } } } } },
      });
    } else {
      // Variable utilisée pour créer un nouvel item
      const _cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          unitPrice,
          subtotal: quantity * unitPrice,
          notes,
        },
        include: { product: { include: { farm: { select: { id: true, name: true } } } } },
      });
    }

    await recalculateCartTotals(cart.id);

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                farm: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return response.success(req, res, updatedCart, i18n.translate('cart.item_added', lang));
  },
);

//& Mettre à jour la quantité d'un item
const updateCartItem = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void | Response<any>> => {
    const userId = req.user?.user_id;
    const { itemId } = req.params;
    const { quantity, notes } = req.body;
    const lang = i18n.detectLanguage(req.headers['accept-language']);

    if (!userId) {
      return response.unauthorized(req, res, i18n.translate('auth.user_not_authenticated', lang));
    }

    if (quantity === undefined || quantity < 0) {
      return response.badRequest(req, res, i18n.translate('cart.invalid_quantity', lang));
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return response.notFound(req, res, 'Panier non trouvé');
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { product: true },
    });

    if (!cartItem) {
      return response.notFound(req, res, i18n.translate('cart.item_not_found', lang));
    }

    if (quantity === 0) {
      await prisma.cartItem.delete({
        where: { id: itemId },
      });
    } else {
      if (cartItem.product.stock < quantity) {
        return response.badRequest(req, res, i18n.translate('cart.stock_insufficient', lang));
      }

      await prisma.cartItem.update({
        where: { id: itemId },
        data: {
          quantity,
          subtotal: quantity * cartItem.unitPrice,
          notes: notes !== undefined ? notes : cartItem.notes,
        },
      });
    }

    await recalculateCartTotals(cart.id);

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                farm: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return response.success(req, res, updatedCart, i18n.translate('cart.item_updated', lang));
  },
);

//& Supprimer un item du panier
const removeCartItem = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void | Response<any>> => {
    const userId = req.user?.user_id;
    const { itemId } = req.params;
    const lang = i18n.detectLanguage(req.headers['accept-language']);

    if (!userId) {
      return response.unauthorized(req, res, i18n.translate('auth.user_not_authenticated', lang));
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return response.notFound(req, res, i18n.translate('cart.not_found', lang));
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!cartItem) {
      return response.notFound(req, res, i18n.translate('cart.item_not_found', lang));
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    await recalculateCartTotals(cart.id);

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                farm: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return response.success(req, res, updatedCart, i18n.translate('cart.item_removed', lang));
  },
);

//& Vider le panier
const clearCart = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void | Response<any>> => {
    const userId = req.user?.user_id;
    const lang = i18n.detectLanguage(req.headers['accept-language']);

    if (!userId) {
      return response.unauthorized(req, res, i18n.translate('auth.user_not_authenticated', lang));
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return response.notFound(req, res, i18n.translate('cart.not_found', lang));
    }

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

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                farm: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return response.success(req, res, updatedCart, i18n.translate('cart.cleared', lang));
  },
);

// Fonction utilitaire pour recalculer les totaux du panier
async function recalculateCartTotals(cartId: string): Promise<void> {
  const items = await prisma.cartItem.findMany({
    where: { cartId },
  });

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  await prisma.cart.update({
    where: { id: cartId },
    data: {
      totalItems,
      totalAmount,
      updatedAt: new Date(),
    },
  });
}

export default {
  getOrCreateCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
