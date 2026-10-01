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
exports.AddressService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const address_entity_1 = require("./entities/address.entity");
const activity_log_service_1 = require("../engagement/activity-log.service");
const activity_log_entity_1 = require("../engagement/entities/activity-log.entity");
let AddressService = class AddressService {
    constructor(addressModel, activityLog) {
        this.addressModel = addressModel;
        this.activityLog = activityLog;
    }
    async create(dto, actorId, req) {
        const address = await this.addressModel.create(dto);
        this.activityLog
            .logActivity({
            userId: actorId ?? null,
            contextTag: activity_log_entity_1.CONTEXT_TAGS.CRM,
            subContext: activity_log_entity_1.SUB_CONTEXTS.ADDRESS,
            action: 'ADDRESS_CREATED',
            entityId: address.addressId,
            entityName: `${address.street}, ${address.city}`,
            description: `Address created for ${dto.userId ? 'User' : 'Customer'}`,
            newValues: {
                addressId: address.addressId,
                street: address.street,
                city: address.city,
                state: address.state,
                postalCode: address.postalCode,
                country: address.country,
                status: address.status,
                userId: address.userId || null,
                customerId: address.customerId || null,
            },
            req,
        })
            .catch(() => { });
        return address;
    }
    findAll() {
        return this.addressModel.findAll();
    }
    async findOne(addressId) {
        const address = await this.addressModel.findByPk(addressId);
        if (!address)
            throw new common_1.NotFoundException('Address not found');
        return address;
    }
    findByUser(userId) {
        return this.addressModel.findAll({ where: { userId } });
    }
    findByCustomer(customerId) {
        return this.addressModel.findAll({ where: { customerId } });
    }
    async update(addressId, dto, actorId, req) {
        const address = await this.findOne(addressId);
        const oldValues = {
            street: address.street,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
            status: address.status,
        };
        await address.update(dto);
        this.activityLog
            .logActivity({
            userId: actorId ?? null,
            contextTag: activity_log_entity_1.CONTEXT_TAGS.CRM,
            subContext: activity_log_entity_1.SUB_CONTEXTS.ADDRESS,
            action: 'ADDRESS_UPDATED',
            entityId: address.addressId,
            entityName: `${address.street}, ${address.city}`,
            description: `Address updated for ${address.userId ? 'User' : 'Customer'}`,
            oldValues,
            newValues: {
                street: address.street,
                city: address.city,
                state: address.state,
                postalCode: address.postalCode,
                country: address.country,
                status: address.status,
            },
            req,
        })
            .catch(() => { });
        return address;
    }
    async remove(addressId, actorId, req) {
        const address = await this.findOne(addressId);
        const snapshot = {
            addressId: address.addressId,
            street: address.street,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
            status: address.status,
            userId: address.userId,
            customerId: address.customerId,
        };
        await address.destroy();
        this.activityLog
            .logActivity({
            userId: actorId ?? null,
            contextTag: activity_log_entity_1.CONTEXT_TAGS.CRM,
            subContext: activity_log_entity_1.SUB_CONTEXTS.ADDRESS,
            action: 'ADDRESS_DELETED',
            entityId: snapshot.addressId,
            entityName: `${snapshot.street}, ${snapshot.city}`,
            description: `Address deleted for ${snapshot.userId ? 'User' : 'Customer'}`,
            oldValues: snapshot,
            req,
        })
            .catch(() => { });
        return { message: 'Address deleted' };
    }
};
exports.AddressService = AddressService;
exports.AddressService = AddressService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, sequelize_1.InjectModel)(address_entity_1.Address)),
    __metadata("design:paramtypes", [Object, activity_log_service_1.ActivityLogService])
], AddressService);
//# sourceMappingURL=address.service.js.map