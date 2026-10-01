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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductKeyword = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const product_entity_1 = require("./product.entity");
const keyword_entity_1 = require("./keyword.entity");
let ProductKeyword = class ProductKeyword extends sequelize_typescript_1.Model {
};
exports.ProductKeyword = ProductKeyword;
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => product_entity_1.Product),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, allowNull: false, primaryKey: true }),
    __metadata("design:type", String)
], ProductKeyword.prototype, "productId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => keyword_entity_1.Keyword),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, allowNull: false, primaryKey: true }),
    __metadata("design:type", String)
], ProductKeyword.prototype, "keywordId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => product_entity_1.Product, { foreignKey: 'productId', as: 'product' }),
    __metadata("design:type", product_entity_1.Product)
], ProductKeyword.prototype, "product", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => keyword_entity_1.Keyword, { foreignKey: 'keywordId', as: 'keyword' }),
    __metadata("design:type", keyword_entity_1.Keyword)
], ProductKeyword.prototype, "keyword", void 0);
exports.ProductKeyword = ProductKeyword = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'products_keywords',
        timestamps: true,
        indexes: [
            { name: 'idx_productId', fields: ['productId'] },
            { name: 'idx_keywordId', fields: ['keywordId'] },
            {
                name: 'unique_product_keyword',
                unique: true,
                fields: ['productId', 'keywordId'],
            },
        ],
    })
], ProductKeyword);
//# sourceMappingURL=product-keyword.entity.js.map