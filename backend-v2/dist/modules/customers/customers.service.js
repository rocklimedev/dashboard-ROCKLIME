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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const sequelize_2 = require("sequelize");
const sequelize_typescript_1 = require("sequelize-typescript");
const customer_entity_1 = require("./entities/customer.entity");
const address_entity_1 = require("../address/entities/address.entity");
const quotation_entity_1 = require("../quotations/entities/quotation.entity");
const order_entity_1 = require("../orders/entities/order.entity");
const activity_log_service_1 = require("../engagement/activity-log.service");
const activity_log_entity_1 = require("../engagement/entities/activity-log.entity");
const customer_dto_1 = require("./dto/customer.dto");
function getTitle(gender) {
    switch (gender) {
        case 'Male':
            return 'Mr.';
        case 'Female':
            return 'Ms.';
        case 'Other':
            return 'Mx.';
        default:
            return '';
    }
}
function withTitle(customerJson) {
    const title = getTitle(customerJson.gender);
    return {
        ...customerJson,
        title,
        displayName: title ? `${title} ${customerJson.name}` : customerJson.name,
    };
}
let CustomersService = class CustomersService {
    constructor(customerModel, quotationModel, orderModel, sequelize, activityLog) {
        this.customerModel = customerModel;
        this.quotationModel = quotationModel;
        this.orderModel = orderModel;
        this.sequelize = sequelize;
        this.activityLog = activityLog;
    }
    async create(dto, userId) {
        if (!dto.name)
            throw new common_1.BadRequestException('name is required');
        if (dto.customerType && !customer_dto_1.CUSTOMER_TYPES.includes(dto.customerType)) {
            throw new common_1.BadRequestException(`Invalid customerType. Must be one of: ${customer_dto_1.CUSTOMER_TYPES.join(', ')}`);
        }
        if (dto.gender && !customer_dto_1.GENDERS.includes(dto.gender)) {
            throw new common_1.BadRequestException(`Invalid gender. Must be one of: ${customer_dto_1.GENDERS.join(', ')}`);
        }
        const newCustomer = await this.customerModel.create({
            ...dto,
            phone2: dto.phone2 || null,
            customerType: dto.customerType || null,
            gstNumber: dto.gstNumber || null,
            gender: dto.gender || null,
        });
        this.activityLog
            .logActivity({
            userId: userId ?? null,
            contextTag: activity_log_entity_1.CONTEXT_TAGS.CRM,
            subContext: activity_log_entity_1.SUB_CONTEXTS.CUSTOMER,
            action: 'CUSTOMER_CREATED',
            entityId: newCustomer.customerId,
            entityName: newCustomer.name,
            description: `Customer "${newCustomer.name}" was created`,
            newValues: {
                customerId: newCustomer.customerId,
                name: newCustomer.name,
                email: newCustomer.email,
                mobileNumber: newCustomer.mobileNumber,
                phone2: newCustomer.phone2,
                customerType: newCustomer.customerType,
                gstNumber: newCustomer.gstNumber,
                gender: newCustomer.gender,
            },
            metadata: { createdBy: userId ?? null },
        })
            .catch(() => { });
        return { success: true, data: withTitle(newCustomer.toJSON()) };
    }
    async findAll(query) {
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 20;
        const offset = (page - 1) * limit;
        const where = {};
        const search = query.search?.trim();
        if (search) {
            const searchTerm = `%${search}%`;
            where[sequelize_2.Op.or] = [
                { name: { [sequelize_2.Op.like]: searchTerm } },
                { email: { [sequelize_2.Op.like]: searchTerm } },
                { mobileNumber: { [sequelize_2.Op.like]: searchTerm } },
                { companyName: { [sequelize_2.Op.like]: searchTerm } },
            ];
        }
        const { count: totalCustomers, rows: customers } = await this.customerModel.findAndCountAll({
            where,
            offset,
            limit,
            order: [['createdAt', 'DESC']],
            distinct: true,
            attributes: { exclude: ['updatedAt'] },
            include: [
                {
                    model: address_entity_1.Address,
                    as: 'addresses',
                    required: false,
                    attributes: ['addressId', 'street', 'city', 'state', 'postalCode', 'country', 'status'],
                },
            ],
        });
        const customerIds = customers.map((c) => c.customerId);
        const quotationStats = customerIds.length
            ? await this.quotationModel.findAll({
                where: { customerId: { [sequelize_2.Op.in]: customerIds } },
                attributes: [
                    'customerId',
                    [this.sequelize.fn('COUNT', this.sequelize.col('quotationId')), 'quotations'],
                    [
                        this.sequelize.fn('COALESCE', this.sequelize.fn('SUM', this.sequelize.col('finalAmount')), 0),
                        'quotationValue',
                    ],
                ],
                group: ['customerId'],
                raw: true,
            })
            : [];
        const orderStats = customerIds.length
            ? await this.orderModel.findAll({
                where: { createdFor: { [sequelize_2.Op.in]: customerIds } },
                attributes: [
                    'createdFor',
                    [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'orders'],
                    [
                        this.sequelize.fn('COALESCE', this.sequelize.fn('SUM', this.sequelize.col('finalAmount')), 0),
                        'orderValue',
                    ],
                ],
                group: ['createdFor'],
                raw: true,
            })
            : [];
        const quotationMap = new Map();
        quotationStats.forEach((item) => quotationMap.set(item.customerId, {
            quotations: Number(item.quotations || 0),
            quotationValue: Number(item.quotationValue || 0),
        }));
        const orderMap = new Map();
        orderStats.forEach((item) => orderMap.set(item.createdFor, {
            orders: Number(item.orders || 0),
            orderValue: Number(item.orderValue || 0),
        }));
        const data = customers.map((customer) => {
            const customerJson = customer.toJSON();
            const q = quotationMap.get(customer.customerId) || {};
            const o = orderMap.get(customer.customerId) || {};
            const quotations = q.quotations || 0;
            const orders = o.orders || 0;
            return withTitle({
                ...customerJson,
                quotations,
                quotationValue: q.quotationValue || 0,
                orders,
                orderValue: o.orderValue || 0,
                customerStatus: quotations === 0 && orders === 0 ? 'INACTIVE' : 'ACTIVE',
            });
        });
        return {
            success: true,
            data,
            pagination: {
                total: totalCustomers,
                page,
                limit,
                totalPages: Math.ceil(totalCustomers / limit),
            },
        };
    }
    async findOne(id) {
        const customer = await this.customerModel.findByPk(id);
        if (!customer)
            throw new common_1.NotFoundException('Customer not found');
        return { success: true, data: withTitle(customer.toJSON()) };
    }
    async update(id, dto) {
        const customer = await this.customerModel.findByPk(id);
        if (!customer)
            throw new common_1.NotFoundException('Customer not found');
        if (dto.customerType && !customer_dto_1.CUSTOMER_TYPES.includes(dto.customerType)) {
            throw new common_1.BadRequestException(`Invalid customerType. Must be one of: ${customer_dto_1.CUSTOMER_TYPES.join(', ')}`);
        }
        if (dto.gender && !customer_dto_1.GENDERS.includes(dto.gender)) {
            throw new common_1.BadRequestException(`Invalid gender. Must be one of: ${customer_dto_1.GENDERS.join(', ')}`);
        }
        await customer.update(dto);
        return { success: true, data: withTitle(customer.toJSON()) };
    }
    async remove(id) {
        const customer = await this.customerModel.findByPk(id);
        if (!customer)
            throw new common_1.NotFoundException('Customer not found');
        await customer.destroy();
        return { success: true, message: 'Customer deleted successfully' };
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, sequelize_1.InjectModel)(customer_entity_1.Customer)),
    __param(1, (0, sequelize_1.InjectModel)(quotation_entity_1.Quotation)),
    __param(2, (0, sequelize_1.InjectModel)(order_entity_1.Order)),
    __param(3, (0, sequelize_1.InjectConnection)()),
    __metadata("design:paramtypes", [Object, Object, Object, sequelize_typescript_1.Sequelize,
        activity_log_service_1.ActivityLogService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map