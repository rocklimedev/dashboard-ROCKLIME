// src/modules/categories/category.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

import { Category } from './entities/category.entity';
import { ParentCategory } from './entities/parent-category.entity';
import { Keyword } from './entities/keyword.entity';
import { Brand } from '@/modules/brands/entities/brand.entity';
import { BrandParentCategory } from '@/modules/brands/entities/brand-parent-category.entity';

import { CategoryService } from './services/category.service';
import { CategoryController } from './controllers/category.controller';
import { ParentCategoryService } from './services/parent-category.service';
import { ParentCategoryController } from './controllers/parent-category.controller';
import { KeywordService } from './services/keyword.service';
import { KeywordController } from './controllers/keyword.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Category,
      ParentCategory,
      Keyword,
      Brand,
      BrandParentCategory,
    ]),
  ],
  controllers: [
    CategoryController,
    ParentCategoryController,
    KeywordController,
  ],
  providers: [CategoryService, ParentCategoryService, KeywordService],
  exports: [CategoryService],
})
export class CategoryModule {}
