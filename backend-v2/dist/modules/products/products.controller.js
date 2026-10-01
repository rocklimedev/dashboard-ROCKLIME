"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const products_service_1 = require("./products.service");
const product_dto_1 = require("./dto/product.dto");
const imageUploadOptions = {
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        cb(null, allowed.test(file.mimetype));
    },
};
let ProductsController = class ProductsController {
    constructor(productsService) {
        this.productsService = productsService;
    }
    count() {
        return this.productsService.count();
    }
    checkCode(code) {
        return this.productsService.checkCode(code);
    }
    lowStock() {
        return this.productsService.getLowStockProducts();
    }
    topSelling() {
        return this.productsService.getTopSellingProducts();
    }
    search() {
        return this.productsService.searchProducts();
    }
    getAllCodes() {
        return this.productsService.getAllProductCodes();
    }
    getAllCodesBrandWise() {
        return this.productsService.getAllProductCodesBrandWise();
    }
    findByCategory(categoryId) {
        return this.productsService.findByCategory(categoryId);
    }
    findByBrand(brandId) {
        return this.productsService.findByBrand(brandId);
    }
    findByIds(dto) {
        return this.productsService.findByIds(dto.productIds);
    }
    bulkImport() {
        return this.productsService.bulkImportProducts();
    }
    bulkInventoryUpdate() {
        return this.productsService.bulkInventoryUpdate();
    }
    create(dto, files) {
        return this.productsService.create(dto, files);
    }
    findAll(query) {
        return this.productsService.findAll(query);
    }
    findOne(productId) {
        return this.productsService.findOne(productId);
    }
    update(productId, dto, files) {
        return this.productsService.update(productId, dto, files);
    }
    remove(productId) {
        return this.productsService.remove(productId);
    }
    updateFeatured(productId, dto) {
        return this.productsService.updateFeatured(productId, dto);
    }
    addStock(productId, dto) {
        return this.productsService.addStock(productId, dto);
    }
    removeStock(productId, dto) {
        return this.productsService.removeStock(productId, dto);
    }
    getHistory(productId, query) {
        return this.productsService.getHistory(productId, query);
    }
    replaceKeywords(productId, dto) {
        return this.productsService.replaceKeywords(productId, dto.keywordIds);
    }
    addKeywords(productId, dto) {
        return this.productsService.addKeywords(productId, dto.keywordIds);
    }
    removeKeyword(productId, keywordId) {
        return this.productsService.removeKeyword(productId, keywordId);
    }
    removeAllKeywords(productId) {
        return this.productsService.removeAllKeywords(productId);
    }
};
exports.ProductsController = ProductsController;
__decorate([
    (0, common_1.Get)('count'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "count", null);
__decorate([
    (0, common_1.Get)('check-code'),
    __param(0, (0, common_1.Query)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "checkCode", null);
__decorate([
    (0, common_1.Get)('low-stock'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "lowStock", null);
__decorate([
    (0, common_1.Get)('top-selling'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "topSelling", null);
__decorate([
    (0, common_1.Get)('search/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('search/get-product-codes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "getAllCodes", null);
__decorate([
    (0, common_1.Get)('codes/brand-wise'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "getAllCodesBrandWise", null);
__decorate([
    (0, common_1.Get)('category/:categoryId'),
    __param(0, (0, common_1.Param)('categoryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "findByCategory", null);
__decorate([
    (0, common_1.Get)('brand/:brandId'),
    __param(0, (0, common_1.Param)('brandId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "findByBrand", null);
__decorate([
    (0, common_1.Post)('by-ids'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [product_dto_1.ProductIdsDto]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "findByIds", null);
__decorate([
    (0, common_1.Post)('bulk-import'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "bulkImport", null);
__decorate([
    (0, common_1.Post)('bulk-inventory-update'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "bulkInventoryUpdate", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('images', 5, imageUploadOptions)),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [product_dto_1.CreateProductDto, Array]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':productId'),
    __param(0, (0, common_1.Param)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':productId'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('images', 5, imageUploadOptions)),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, product_dto_1.UpdateProductDto, Array]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':productId'),
    __param(0, (0, common_1.Param)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':productId/featured'),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, product_dto_1.UpdateFeaturedDto]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "updateFeatured", null);
__decorate([
    (0, common_1.Post)(':productId/add-stock'),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, product_dto_1.AddStockDto]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "addStock", null);
__decorate([
    (0, common_1.Post)(':productId/remove-stock'),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, product_dto_1.RemoveStockDto]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "removeStock", null);
__decorate([
    (0, common_1.Get)(':productId/history'),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Put)(':productId/keywords'),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, product_dto_1.KeywordIdsDto]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "replaceKeywords", null);
__decorate([
    (0, common_1.Post)(':productId/keywords'),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, product_dto_1.KeywordIdsDto]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "addKeywords", null);
__decorate([
    (0, common_1.Delete)(':productId/keywords/:keywordId'),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Param)('keywordId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "removeKeyword", null);
__decorate([
    (0, common_1.Delete)(':productId/keywords'),
    __param(0, (0, common_1.Param)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "removeAllKeywords", null);
exports.ProductsController = ProductsController = __decorate([
    (0, common_1.Controller)('products'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [products_service_1.ProductsService])
], ProductsController);
//# sourceMappingURL=products.controller.js.map