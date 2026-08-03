import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

import { ProductsService } from '../services/products.service';
import { ProductQueryService } from '../services/product-query.service';
import { InventoryService } from '../services/inventory.service';
import { ProductVariantsService } from '../services/product-variants.service';
import { ProductKeywordsService } from '../services/product-keywords.service';
import { ProductImportService } from '../services/product-import.service';
import { ProductAnalyticsService } from '../services/product-analytics.service';

import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { QueryProductsDto } from '../dto/query-product.dto';
import { ProductsByRelationQueryDto } from '../dto/products-by-relation-query.dto';
import { SearchProductsDto } from '../dto/search-products.dto';
import { AdjustStockDto } from '../dto/adjust-stock.dto';
import { BulkInventoryUpdateDto } from '../dto/bulk-inventory-update.dto';
import { BatchCreateProductsDto } from '../dto/batch-create-products.dto';
import { BulkImportProductsDto } from '../dto/bulk-import-products.dto';
import { AddKeywordsDto } from '../dto/add-keywords.dto';
import { ReplaceKeywordsDto } from '../dto/replace-keywords.dto';
import { CreateVariantDto } from '../dto/create-variant.dto';
import { UpdateFeaturedDto } from '../dto/update-featured.dto';
import { GetProductsByIdsDto } from '../dto/get-products-by-ids.dto';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly productQueryService: ProductQueryService,
    private readonly inventoryService: InventoryService,
    private readonly variantsService: ProductVariantsService,
    private readonly keywordsService: ProductKeywordsService,
    private readonly importService: ProductImportService,
    private readonly analyticsService: ProductAnalyticsService,
  ) {}

  // ── CRUD ──────────────────────────────────────────────────────
  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  create(
    @Body() dto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.productsService.create(dto, files);
  }

  @Get()
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll({
      page: query.page ?? 1,
      limit: query.limit ?? 50,
      search: query.search,
      tab: query.tab ?? 'all',
      lowStockThreshold: query.lowStockThreshold ?? 10,
    });
  }

  // NOTE: all literal-segment routes below (count, codes, search, ...) must
  // stay declared before the ":productId" catch-all route further down.
  @Get('count')
  getCount() {
    return this.productsService.getCount();
  }

  @Get('codes')
  getAllCodes() {
    return this.productsService.getAllProductCodes();
  }

  @Get('codes/brand-wise')
  getAllCodesBrandWise() {
    return this.productsService.getAllProductCodesBrandWise();
  }

  @Get('codes/check')
  checkCode(@Query('code') code: string) {
    return this.productsService.checkProductCode(code);
  }

  @Get('search')
  search(@Query() dto: SearchProductsDto) {
    return this.productQueryService.search(dto);
  }

  @Get('top-selling')
  getTopSelling(@Query('limit') limit?: string) {
    return this.analyticsService.getTopSelling(
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('low-stock')
  getLowStock(
    @Query('threshold') threshold?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getLowStock(
      threshold ? parseInt(threshold, 10) : 20,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('category/:categoryId')
  findByCategory(
    @Param('categoryId') categoryId: string,
    @Query() query: ProductsByRelationQueryDto,
  ) {
    return this.productQueryService.findByCategory(categoryId, query);
  }

  @Get('brand/:brandId')
  findByBrand(
    @Param('brandId') brandId: string,
    @Query() query: ProductsByRelationQueryDto,
  ) {
    return this.productQueryService.findByBrand(brandId, query);
  }

  @Post('by-ids')
  findByIds(@Body() dto: GetProductsByIdsDto) {
    return this.productsService.findByIds(dto);
  }

  // ── Bulk create / import ────────────────────────────────────────
  @Post('batch')
  batchCreate(@Body() dto: BatchCreateProductsDto) {
    return this.importService.batchCreate(dto);
  }

  @Post('bulk-import')
  bulkImport(@Body() dto: BulkImportProductsDto) {
    return this.importService.bulkImport(dto);
  }

  @Post('inventory/bulk-update')
  bulkInventoryUpdate(@Body() dto: BulkInventoryUpdateDto) {
    return this.inventoryService.bulkUpdate(dto);
  }

  // ── Single product ──────────────────────────────────────────────
  @Get(':productId')
  findOne(@Param('productId') productId: string) {
    return this.productsService.findById(productId);
  }

  @Put(':productId')
  @UseInterceptors(FilesInterceptor('files'))
  update(
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.productsService.update(productId, dto, files);
  }

  @Delete(':productId')
  remove(@Param('productId') productId: string) {
    return this.productsService.remove(productId);
  }

  @Patch(':productId/featured')
  updateFeatured(
    @Param('productId') productId: string,
    @Body() dto: UpdateFeaturedDto,
  ) {
    return this.productsService.updateFeatured(productId, dto.isFeatured);
  }

  // ── Variants ─────────────────────────────────────────────────────
  @Get(':productId/with-variants')
  getWithVariants(@Param('productId') productId: string) {
    return this.variantsService.getWithVariants(productId);
  }

  @Post(':masterId/variants')
  createVariant(
    @Param('masterId') masterId: string,
    @Body() dto: CreateVariantDto,
  ) {
    return this.variantsService.createVariant(masterId, dto);
  }

  // ── Inventory ────────────────────────────────────────────────────
  @Post(':productId/stock/add')
  addStock(@Param('productId') productId: string, @Body() dto: AdjustStockDto) {
    return this.inventoryService.addStock(productId, dto);
  }

  @Post(':productId/stock/remove')
  removeStock(
    @Param('productId') productId: string,
    @Body() dto: AdjustStockDto,
  ) {
    return this.inventoryService.removeStock(productId, dto);
  }

  @Get(':productId/history')
  getHistory(
    @Param('productId') productId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getHistory(
      productId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  // ── Keywords ─────────────────────────────────────────────────────
  @Post(':productId/keywords')
  addKeywords(
    @Param('productId') productId: string,
    @Body() dto: AddKeywordsDto,
  ) {
    return this.keywordsService.addKeywords(productId, dto);
  }

  @Put(':productId/keywords')
  replaceKeywords(
    @Param('productId') productId: string,
    @Body() dto: ReplaceKeywordsDto,
  ) {
    return this.keywordsService.replaceAllKeywords(productId, dto);
  }

  @Delete(':productId/keywords')
  removeAllKeywords(@Param('productId') productId: string) {
    return this.keywordsService.removeAllKeywords(productId);
  }

  @Delete(':productId/keywords/:keywordId')
  removeKeyword(
    @Param('productId') productId: string,
    @Param('keywordId') keywordId: string,
  ) {
    return this.keywordsService.removeKeyword(productId, keywordId);
  }
}
