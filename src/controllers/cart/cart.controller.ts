import { addDays } from 'date-fns';
import type { Response } from 'express';

import prisma from '@/config/prisma/prisma';
import type { AuthenticatedRequest } from '@/types/express';
import { asyncHandler, response } from '@/utils/responses/helpers';

//& Récupérer ou créer le panier de l'utilisateur
const getOrCreateCart = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void | Response<any>> => {
    const userId = req.user?.user_id;

    if (!userId) {
      return response.unauthorized(req, res, 'Utilisateur non authentifié');
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

    return response.success(req, res, cart, 'Panier récupéré avec succès');
  },
);

//& Ajouter un item au panier
const addItemToCart = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void | Response<any>> => {
    const userId = req.user?.user_id;
    const { productId, quantity, notes } = req.body;

    if (!userId) {
      return response.unauthorized(req, res, 'Utilisateur non authentifié');
    }

    if (!productId || !quantity || quantity < 1) {
      return response.badRequest(req, res, 'Produit et quantité valide requis');
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { farm: { select: { id: true, name: true } } },
    });

    if (!product) {
      return response.notFound(req, res, 'Produit non trouvé');
    }

    if (!product.isAvailable || product.stock < quantity) {
      return response.badRequest(req, res, 'Produit indisponible ou stock insuffisant');
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
        return response.badRequest(req, res, 'Stock insuffisant pour cette quantité');
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

    return response.success(req, res, updatedCart, 'Item ajouté au panier avec succès');
  },
);

//& Mettre à jour la quantité d'un item
const updateCartItem = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void | Response<any>> => {
    const userId = req.user?.user_id;
    const { itemId } = req.params;
    const { quantity, notes } = req.body;

    if (!userId) {
      return response.unauthorized(req, res, 'Utilisateur non authentifié');
    }

    if (quantity === undefined || quantity < 0) {
      return response.badRequest(req, res, 'Quantité invalide');
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
      return response.notFound(req, res, 'Item non trouvé dans le panier');
    }

    if (quantity === 0) {
      await prisma.cartItem.delete({
        where: { id: itemId },
      });
    } else {
      if (cartItem.product.stock < quantity) {
        return response.badRequest(req, res, 'Stock insuffisant');
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

    return response.success(req, res, updatedCart, 'Item mis à jour avec succès');
  },
);

//& Supprimer un item du panier
const removeCartItem = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void | Response<any>> => {
    const userId = req.user?.user_id;
    const { itemId } = req.params;

    if (!userId) {
      return response.unauthorized(req, res, 'Utilisateur non authentifié');
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return response.notFound(req, res, 'Panier non trouvé');
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!cartItem) {
      return response.notFound(req, res, 'Item non trouvé dans le panier');
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

    return response.success(req, res, updatedCart, 'Item supprimé du panier avec succès');
  },
);

//& Vider le panier
const clearCart = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void | Response<any>> => {
    const userId = req.user?.user_id;

    if (!userId) {
      return response.unauthorized(req, res, 'Utilisateur non authentifié');
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return response.notFound(req, res, 'Panier non trouvé');
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

    return response.success(req, res, updatedCart, 'Panier vidé avec succès');
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
