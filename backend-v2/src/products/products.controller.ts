import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFiles,
  ParseUUIDPipe,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductService } from './product.service';
import {
  CreateProductDto,
  UpdateProductDto,
  BulkImportDto,
} from './dto/product.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // ==================== CREATE PRODUCT ====================
  @Post()
  @UseInterceptors(FilesInterceptor('files')) // for multiple image uploads
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.productService.createProduct(createProductDto, files);
  }

  // ==================== UPDATE PRODUCT ====================
  @Put(':productId')
  @UseInterceptors(FilesInterceptor('files'))
  async updateProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.productService.updateProduct(
      productId,
      updateProductDto,
      files,
    );
  }

  // ==================== GET ALL PRODUCTS (with pagination & filters) ====================
  @Get()
  async getAllProducts(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('search') search?: string,
    @Query('tab') tab: string = 'all',
    @Query('lowStockThreshold') lowStockThreshold?: string,
  ) {
    return this.productService.getAllProducts({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      tab,
      lowStockThreshold: parseInt(lowStockThreshold) || 10,
    });
  }

  // ==================== GET SINGLE PRODUCT ====================
  @Get(':productId')
  async getProductById(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.productService.getProductById(productId);
  }

  // ==================== DELETE PRODUCT ====================
  @Delete(':productId')
  async deleteProduct(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.productService.deleteProduct(productId);
  }

  // ==================== GET PRODUCTS BY CATEGORY ====================
  @Get('category/:categoryId')
  async getProductsByCategory(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('search') search?: string,
  ) {
    return this.productService.getProductsByCategory(categoryId, {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
    });
  }

  // ==================== GET PRODUCTS BY BRAND ====================
  @Get('brand/:brandId')
  async getProductsByBrand(
    @Param('brandId', ParseUUIDPipe) brandId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('search') search?: string,
  ) {
    return this.productService.getProductsByBrand(brandId, {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
    });
  }

  // ==================== STOCK MANAGEMENT ====================
  @Post(':productId/add-stock')
  async addStock(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body()
    body: {
      quantity: number;
      orderNo?: string;
      userId?: string;
      message?: string;
    },
  ) {
    return this.productService.addStock(productId, body);
  }

  @Post(':productId/remove-stock')
  async removeStock(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body()
    body: {
      quantity: number;
      orderNo?: string;
      userId?: string;
      message?: string;
    },
  ) {
    return this.productService.removeStock(productId, body);
  }

  @Get(':productId/history')
  async getHistoryByProductId(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.productService.getHistoryByProductId(productId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  // ==================== KEYWORD MANAGEMENT ====================
  @Post(':productId/keywords')
  async addKeywordsToProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body('keywordIds') keywordIds: string[],
  ) {
    return this.productService.addKeywordsToProduct(productId, keywordIds);
  }

  @Delete(':productId/keywords/:keywordId')
  async removeKeywordFromProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('keywordId', ParseUUIDPipe) keywordId: string,
  ) {
    return this.productService.removeKeywordFromProduct(productId, keywordId);
  }

  @Delete(':productId/keywords')
  async removeAllKeywordsFromProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.productService.removeAllKeywordsFromProduct(productId);
  }

  @Put(':productId/keywords')
  async replaceAllKeywordsForProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body('keywordIds') keywordIds: string[],
  ) {
    return this.productService.replaceAllKeywordsForProduct(
      productId,
      keywordIds,
    );
  }

  // ==================== OTHER USEFUL ENDPOINTS ====================
  @Get('top-selling')
  async getTopSellingProducts(@Query('limit') limit = '10') {
    return this.productService.getTopSellingProducts(parseInt(limit));
  }

  @Post('bulk-import')
  async bulkImportProducts(@Body() bulkImportDto: BulkImportDto) {
    return this.productService.bulkImportProducts(bulkImportDto.products);
  }

  @Get('check-code')
  async checkProductCode(@Query('code') code: string) {
    return this.productService.checkProductCode(code);
  }
}
