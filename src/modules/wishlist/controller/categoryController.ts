import { Request, Response } from 'express';
import { AppError, AppResponse, toJSON } from '@/common/utils';
import { catchAsync } from '@/middlewares';
import { categoryRepository } from '../repository';
import { ICategory } from '@/common/interfaces';

export class CategoryController {
	createCategory = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { name } = req.body;

		if (!user) {
			throw new AppError('Please log in to create a category', 401);
		}
		if (user.role !== 'admin') {
			throw new AppError('Only admins can create categories', 403);
		}
		if (!name) {
			throw new AppError('Name is required', 400);
		}

		const isCategoryExist = await categoryRepository.findByName(name.toLowerCase());
		if (isCategoryExist) {
			throw new AppError('Category with this name already exists', 400);
		}

		const [category] = await categoryRepository.create({
			name: name.toLowerCase(),
		});
		if (!category) {
			throw new AppError('Failed to create category', 500);
		}

		return AppResponse(res, 201, toJSON([category]), 'Category created successfully');
	});

	getCategories = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;

		if (!user) {
			throw new AppError('Please log in to view categories', 401);
		}

		const categories = await categoryRepository.findAll();
		if (!categories) {
			throw new AppError('Failed to fetch active categories', 500);
		}

		return AppResponse(res, 200, toJSON(categories), 'Categories fetched successfully');
	});

	getCategoryById = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { categoryId } = req.query;

		if (!user) {
			throw new AppError('Please log in to view categories', 401);
		}
		if (!categoryId) {
			throw new AppError('Category ID is required', 400);
		}

		const category = await categoryRepository.findById(categoryId as string);
		if (!category) {
			throw new AppError('Category not found', 404);
		}

		return AppResponse(res, 200, toJSON([category]), 'Category fetched successfully');
	})

	updateCategory = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { categoryId, name } = req.body;

		if (!user) {
			throw new AppError('Please log in to update a category', 401);
		}
		if (user.role !== 'admin') {
			throw new AppError('Only admins can update categories', 403);
		}
		if (!categoryId) {
			throw new AppError('Category ID is required', 400);
		}

		const existingCategory = await categoryRepository.findById(categoryId);
		if (!existingCategory) {
			throw new AppError('Category not found', 404);
		}

		const updatePayload: Partial<ICategory> = {};
		if (name) updatePayload.name = name.toLowerCase();

		const [updatedCategories] = await categoryRepository.update(categoryId, updatePayload);
		if (!updatedCategories) {
			throw new AppError('Failed to update category', 500);
		}
		return AppResponse(res, 200, toJSON([updatedCategories]), 'Category updated successfully');
	});

	deleteCategory = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { categoryId } = req.body;

		if (!user) {
			throw new AppError('Please log in to delete a category', 401);
		}
		if (user.role !== 'admin') {
			throw new AppError('Only admins can delete categories', 403);
		}
		if (!categoryId) {
			throw new AppError('Category ID is required', 400);
		}

		const existingCategory = await categoryRepository.findById(categoryId);
		if (!existingCategory) {
			throw new AppError('Category not found', 404);
		}

		const deletedCount = await categoryRepository.delete(categoryId);
		if (deletedCount === 0) {
			throw new AppError('Failed to delete category', 500);
		}

		return AppResponse(res, 200, null, 'Category deleted successfully');
	});
}

export const categoryController = new CategoryController();
