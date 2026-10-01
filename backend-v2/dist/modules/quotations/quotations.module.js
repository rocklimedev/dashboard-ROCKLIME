"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationsModule = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const mongoose_1 = require("@nestjs/mongoose");
const quotation_entity_1 = require("./entities/quotation.entity");
const customer_entity_1 = require("../customers/entities/customer.entity");
const user_entity_1 = require("../users/entities/user.entity");
const product_entity_1 = require("../products/entities/product.entity");
const quotation_item_schema_1 = require("./schemas/quotation-item.schema");
const quotation_version_schema_1 = require("./schemas/quotation-version.schema");
const quotations_controller_1 = require("./quotations.controller");
const quotations_service_1 = require("./quotations.service");
const quotation_number_service_1 = require("./services/quotation-number.service");
const versioning_service_1 = require("./services/versioning.service");
const product_enrichment_service_1 = require("./services/product-enrichment.service");
let QuotationsModule = class QuotationsModule {
};
exports.QuotationsModule = QuotationsModule;
exports.QuotationsModule = QuotationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            sequelize_1.SequelizeModule.forFeature([quotation_entity_1.Quotation, customer_entity_1.Customer, user_entity_1.User, product_entity_1.Product]),
            mongoose_1.MongooseModule.forFeature([
                { name: quotation_item_schema_1.QuotationItem.name, schema: quotation_item_schema_1.QuotationItemSchema },
                { name: quotation_version_schema_1.QuotationVersion.name, schema: quotation_version_schema_1.QuotationVersionSchema },
            ]),
        ],
        controllers: [quotations_controller_1.QuotationsController],
        providers: [
            quotations_service_1.QuotationsService,
            quotation_number_service_1.QuotationNumberService,
            versioning_service_1.VersioningService,
            product_enrichment_service_1.ProductEnrichmentService,
        ],
        exports: [quotations_service_1.QuotationsService],
    })
], QuotationsModule);
//# sourceMappingURL=quotations.module.js.map