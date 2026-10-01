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
exports.Keyword = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const product_entity_1 = require("./product.entity");
const product_keyword_entity_1 = require("./product-keyword.entity");
let Keyword = class Keyword extends sequelize_typescript_1.Model {
};
exports.Keyword = Keyword;
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        primaryKey: true,
        defaultValue: sequelize_typescript_1.DataType.UUIDV4,
    }),
    __metadata("design:type", String)
], Keyword.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING, allowNull: false }),
    __metadata("design:type", String)
], Keyword.prototype, "keyword", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING, allowNull: true }),
    __metadata("design:type", String)
], Keyword.prototype, "type", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.UUID, allowNull: true }),
    __metadata("design:type", String)
], Keyword.prototype, "categoryId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsToMany)(() => product_entity_1.Product, () => product_keyword_entity_1.ProductKeyword),
    __metadata("design:type", Array)
], Keyword.prototype, "products", void 0);
exports.Keyword = Keyword = __decorate([
    (0, sequelize_typescript_1.Table)({ tableName: 'keywords', timestamps: true })
], Keyword);
//# sourceMappingURL=keyword.entity.js.map