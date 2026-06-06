// src/modules/categories/services/parent-category.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ParentCategory } from '../entities/parent-category.entity';
import { Brand } from '@/modules/brands/entities/brand.entity';
import { Category } from '../entities/category.entity';
import { CreateParentCategoryDto, UpdateParentCategoryDto } from '../dto';
import { Op } from 'sequelize';

@Injectable()
export class ParentCategoryService {
  constructor(
    @InjectModel(ParentCategory)
    private readonly parentCategoryModel: typeof ParentCategory,
    @InjectModel(Brand) private readonly brandModel: typeof Brand,
    @InjectModel(Category) private readonly categoryModel: typeof Category,
  ) {}

  async create(dto: CreateParentCategoryDto) {
    const { name, slug } = dto;

    const existing = await this.parentCategoryModel.findOne({
      where: { [Op.or]: [{ name }, { slug }] },
    });

    if (existing) {
      throw new ConflictException(
        'Parent category with this name or slug already exists',
      );
    }

    return this.parentCategoryModel.create({ name, slug });
  }

  async findAll() {
    return this.parentCategoryModel.findAll({
      order: [['name', 'ASC']],
    });
  }

  async findOne(id: string) {
    const category = await this.parentCategoryModel.findByPk(id);
    if (!category) throw new NotFoundException('Parent category not found');
    return category;
  }

  async update(id: string, dto: UpdateParentCategoryDto) {
    const category = await this.findOne(id);

    const { name, slug } = dto;

    if (name || slug) {
      const existing = await this.parentCategoryModel.findOne({
        where: {
          [Op.or]: [name ? { name } : {}, slug ? { slug } : {}],
          id: { [Op.ne]: id },
        },
      });

      if (existing) {
        throw new ConflictException(
          'Name or slug already in use by another category',
        );
      }
    }

    await category.update({
      name: name ?? category.name,
      slug: slug ?? category.slug,
    });

    return category;
  }

  async remove(id: string) {
    const category = await this.findOne(id);
    await category.destroy();
  }

  async getParentCategoryWithBrandsAndCounts(id: string) {
    const parent = await this.parentCategoryModel.findByPk(id, {
      include: [
        {
          model: Brand,
          as: 'brands',
          through: { attributes: [] },
        },
        {
          model: Category,
          as: 'categories',
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });

    if (!parent) throw new NotFoundException('Parent category not found');

    return {
      id: parent.id,
      name: parent.name,
      slug: parent.slug,
      brands: parent.brands,
      categoriesCount: parent.categories?.length || 0,
    };
  }
}
