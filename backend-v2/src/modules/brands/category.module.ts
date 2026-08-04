// src/modules/categories/category.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

import { Category } from './models/category.model';
import { ParentCategory } from './models/parentcategory.model';
import { Keyword } from './models/keyword.model';
import { Brand } from './models/brand.model';
import { BrandParentCategory } from './models/brand-parent-category.model';

import { CategoryService } from './services/category.service';
import { CategoryController } from './controller/category.controller';
import { ParentCategoryService } from './services/parent-category.service';
import { ParentCategoryController } from './controller/parent-category.controller';
import { KeywordService } from './services/keyword.service';
import { KeywordController } from './controller/keyword.controller';

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
