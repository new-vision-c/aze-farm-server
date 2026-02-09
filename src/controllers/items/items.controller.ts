import type { Request, Response } from 'express';

import { asyncHandler, response } from '@/utils/responses/helpers';

//& Create one item
const createItem = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    return response.created(req, res, {}, 'Item created successfully');
  },
);

//& Get All Items
const getAllItems = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    return response.success(req, res, [], 'Items retrieved successfully');
  },
);

//& Get One Item
const getOneItem = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { id } = req.params;
    return response.success(req, res, { id }, 'Item retrieved successfully');
  },
);

//& Update an Item
const updateItem = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { id } = req.params;
    return response.success(req, res, { id, ...req.body }, 'Item updated successfully');
  },
);

//& Delete one Item
const deleteItem = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { id } = req.params;
    return response.success(req, res, { id }, 'Item deleted successfully');
  },
);

//& Delete all Items
const deleteAllItems = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    return response.success(req, res, {}, 'All items deleted successfully');
  },
);

export default {
  createItem,
  getAllItems,
  getOneItem,
  updateItem,
  deleteItem,
  deleteAllItems,
};
