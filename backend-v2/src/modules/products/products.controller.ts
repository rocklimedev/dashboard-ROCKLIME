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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProductsService } from './products.service';
import {
  AddStockDto,
  CreateProductDto,
  KeywordIdsDto,
  ProductIdsDto,
  RemoveStockDto,
  UpdateFeaturedDto,
  UpdateProductDto,
} from './dto/product.dto';

const imageUploadOptions = {
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    cb(null, allowed.test(file.mimetype));
  },
};

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Static/utility routes first (mirrors legacy route ordering, though
  // Nest doesn't care about declaration order the way Express does).
  @Get('count')
  count() {
    return this.productsService.count();
  }

  @Get('check-code')
  checkCode(@Query('code') code: string) {
    return this.productsService.checkCode(code);
  }

  @Get('low-stock')
  lowStock() {
    return this.productsService.getLowStockProducts();
  }

  @Get('top-selling')
  topSelling() {
    return this.productsService.getTopSellingProducts();
  }

  @Get('search/all')
  search() {
    return this.productsService.searchProducts();
  }

  @Get('search/get-product-codes')
  getAllCodes() {
    return this.productsService.getAllProductCodes();
  }

  @Get('codes/brand-wise')
  getAllCodesBrandWise() {
    return this.productsService.getAllProductCodesBrandWise();
  }

  @Get('category/:categoryId')
  findByCategory(@Param('categoryId') categoryId: string) {
    return this.productsService.findByCategory(categoryId);
  }

  @Get('brand/:brandId')
  findByBrand(@Param('brandId') brandId: string) {
    return this.productsService.findByBrand(brandId);
  }

  @Post('by-ids')
  findByIds(@Body() dto: ProductIdsDto) {
    return this.productsService.findByIds(dto.productIds);
  }

  @Post('bulk-import')
  bulkImport() {
    return this.productsService.bulkImportProducts();
  }

  @Post('bulk-inventory-update')
  bulkInventoryUpdate() {
    return this.productsService.bulkInventoryUpdate();
  }

  @Post()
  @UseInterceptors(FilesInterceptor('images', 5, imageUploadOptions))
  create(
    @Body() dto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.productsService.create(dto, files);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.productsService.findAll(query);
  }

  @Get(':productId')
  findOne(@Param('productId') productId: string) {
    return this.productsService.findOne(productId);
  }

  @Put(':productId')
  @UseInterceptors(FilesInterceptor('images', 5, imageUploadOptions))
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
    return this.productsService.updateFeatured(productId, dto);
  }

  @Post(':productId/add-stock')
  addStock(@Param('productId') productId: string, @Body() dto: AddStockDto) {
    return this.productsService.addStock(productId, dto);
  }

  @Post(':productId/remove-stock')
  removeStock(
    @Param('productId') productId: string,
    @Body() dto: RemoveStockDto,
  ) {
    return this.productsService.removeStock(productId, dto);
  }

  @Get(':productId/history')
  getHistory(@Param('productId') productId: string, @Query() query: any) {
    return this.productsService.getHistory(productId, query);
  }

  @Put(':productId/keywords')
  replaceKeywords(
    @Param('productId') productId: string,
    @Body() dto: KeywordIdsDto,
  ) {
    return this.productsService.replaceKeywords(productId, dto.keywordIds);
  }

  @Post(':productId/keywords')
  addKeywords(
    @Param('productId') productId: string,
    @Body() dto: KeywordIdsDto,
  ) {
    return this.productsService.addKeywords(productId, dto.keywordIds);
  }

  @Delete(':productId/keywords/:keywordId')
  removeKeyword(
    @Param('productId') productId: string,
    @Param('keywordId') keywordId: string,
  ) {
    return this.productsService.removeKeyword(productId, keywordId);
  }

  @Delete(':productId/keywords')
  removeAllKeywords(@Param('productId') productId: string) {
    return this.productsService.removeAllKeywords(productId);
  }
}
