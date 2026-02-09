import type { Request, Response } from 'express';

import { asyncHandler, response } from '@/utils/responses/helpers';

export class ExampleController {
  //& Test i18n endpoint
  testI18n = asyncHandler(async (req: Request, res: Response): Promise<void | Response<any>> => {
    return response.success(req, res, { message: 'Example endpoint working' }, 'Success');
  });

  //& Test error endpoint
  testError = asyncHandler(async (req: Request, res: Response): Promise<void | Response<any>> => {
    return response.success(req, res, { message: 'Error test endpoint' }, 'Success');
  });

  //& Test params endpoint
  testParams = asyncHandler(async (req: Request, res: Response): Promise<void | Response<any>> => {
    return response.success(req, res, { params: req.params }, 'Success');
  });

  //& Test validation endpoint
  testValidation = asyncHandler(
    async (req: Request, res: Response): Promise<void | Response<any>> => {
      return response.success(req, res, { message: 'Validation test endpoint' }, 'Success');
    },
  );

  //& Test pagination endpoint
  testPagination = asyncHandler(
    async (req: Request, res: Response): Promise<void | Response<any>> => {
      return response.success(req, res, { message: 'Pagination test endpoint' }, 'Success');
    },
  );
}

export default ExampleController;
