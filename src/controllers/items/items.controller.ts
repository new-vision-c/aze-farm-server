import type { Request, Response } from 'express';

import { I18nService } from '@/services/I18nService';
import { asyncHandler, response } from '@/utils/responses/helpers';

// Instance du service i18n
const i18n = new I18nService();

//& Create one item
const createItem = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const lang = i18n.detectLanguage(req.headers['accept-language']);
    return response.created(req, res, {}, i18n.translate('items.created', lang));
  },
);

//& Get All Items
const getAllItems = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const lang = i18n.detectLanguage(req.headers['accept-language']);
    return response.success(req, res, [], i18n.translate('items.retrieved', lang));
  },
);

//& Get One Item
const getOneItem = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { id } = req.params;
    const lang = i18n.detectLanguage(req.headers['accept-language']);
    return response.success(req, res, { id }, i18n.translate('items.retrieved_single', lang));
  },
);

//& Update an Item
const updateItem = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { id } = req.params;
    const lang = i18n.detectLanguage(req.headers['accept-language']);
    return response.success(req, res, { id, ...req.body }, i18n.translate('items.updated', lang));
  },
);

//& Delete one Item
const deleteItem = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const { id } = req.params;
    const lang = i18n.detectLanguage(req.headers['accept-language']);
    return response.success(req, res, { id }, i18n.translate('items.deleted', lang));
  },
);

//& Delete all Items
const deleteAllItems = asyncHandler(
  async (req: Request, res: Response): Promise<void | Response<any>> => {
    const lang = i18n.detectLanguage(req.headers['accept-language']);
    return response.success(req, res, {}, i18n.translate('items.deleted_all', lang));
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
