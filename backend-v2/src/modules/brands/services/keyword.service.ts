// src/modules/categories/services/keyword.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Keyword } from '../entities/keyword.entity';
import { Category } from '../entities/category.entity';
import { CreateKeywordDto, UpdateKeywordDto } from '../dto';
import { Op, Sequelize } from 'sequelize';

@Injectable()
export class KeywordService {
  constructor(
    @InjectModel(Keyword) private readonly keywordModel: typeof Keyword,
    @InjectModel(Category) private readonly categoryModel: typeof Category,
    private readonly sequelize: Sequelize,
  ) {}

  async createKeyword(dto: CreateKeywordDto) {
    const { keyword, categoryId } = dto;
    const trimmed = keyword?.trim();

    if (!trimmed || !categoryId) {
      throw new BadRequestException('Keyword and categoryId are required');
    }

    // Check if category exists
    const categoryExists = await this.categoryModel.findByPk(categoryId);
    if (!categoryExists) {
      throw new BadRequestException('Invalid categoryId');
    }

    // Case-insensitive check for existing keyword in the same category
    const existing = await this.keywordModel.findOne({
      where: {
        categoryId,
        [Op.and]: this.sequelize.where(
          this.sequelize.fn('LOWER', this.sequelize.col('keyword')),
          this.sequelize.fn('LOWER', trimmed),
        ),
      },
    });

    if (existing) {
      return this.keywordModel.findByPk(existing.id, {
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['categoryId', 'name', 'slug'],
          },
        ],
      });
    }

    // Create new keyword
    const newKeyword = await this.keywordModel.create({
      keyword: trimmed,
      categoryId,
    });

    return this.keywordModel.findByPk(newKeyword.id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['categoryId', 'name', 'slug'],
        },
      ],
    });
  }

  async findAll() {
    return this.keywordModel.findAll({
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['categoryId', 'name', 'slug'],
        },
      ],
      order: [['keyword', 'ASC']],
    });
  }

  async findByCategory(categoryId: string) {
    return this.keywordModel.findAll({
      where: { categoryId },
      order: [['keyword', 'ASC']],
    });
  }

  async findOne(id: string) {
    const keyword = await this.keywordModel.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['categoryId', 'name', 'slug'],
        },
      ],
    });

    if (!keyword) throw new NotFoundException('Keyword not found');
    return keyword;
  }

  async update(id: string, dto: UpdateKeywordDto) {
    const keyword = await this.keywordModel.findByPk(id);
    if (!keyword) throw new NotFoundException('Keyword not found');

    const { keyword: newKeyword, categoryId } = dto;

    if (newKeyword) {
      keyword.keyword = newKeyword.trim();
    }

    if (categoryId) {
      const category = await this.categoryModel.findByPk(categoryId);
      if (!category) throw new BadRequestException('Invalid categoryId');
      keyword.categoryId = categoryId;
    }

    await keyword.save();
    return keyword;
  }

  async remove(id: string) {
    const keyword = await this.keywordModel.findByPk(id);
    if (!keyword) throw new NotFoundException('Keyword not found');

    await keyword.destroy();
  }
}
