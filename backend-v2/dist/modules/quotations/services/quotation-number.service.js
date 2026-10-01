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
exports.QuotationNumberService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const sequelize_2 = require("sequelize");
const moment = require("moment");
const quotation_entity_1 = require("../entities/quotation.entity");
let QuotationNumberService = class QuotationNumberService {
    constructor(quotationModel) {
        this.quotationModel = quotationModel;
    }
    async generateQuotationNumber(t) {
        const today = moment();
        const prefixDate = today.format('DDMMYY');
        const fullPrefix = `QUO${prefixDate}`;
        const todayStart = today.clone().startOf('day').toDate();
        const todayEnd = today.clone().endOf('day').toDate();
        const MAX_ATTEMPTS = 15;
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            const last = await this.quotationModel.findOne({
                where: {
                    reference_number: { [sequelize_2.Op.like]: `${fullPrefix}%` },
                    createdAt: { [sequelize_2.Op.between]: [todayStart, todayEnd] },
                },
                attributes: ['reference_number'],
                order: [['reference_number', 'DESC']],
                limit: 1,
                transaction: t,
                lock: t.LOCK.UPDATE,
            });
            let nextSeq = 101;
            if (last) {
                const seqStr = last.reference_number.slice(fullPrefix.length);
                const parsed = parseInt(seqStr, 10);
                if (!isNaN(parsed) && parsed >= 100)
                    nextSeq = parsed + 1;
            }
            const candidate = `${fullPrefix}${nextSeq}`;
            const exists = await this.quotationModel.findOne({
                where: { reference_number: candidate },
                transaction: t,
            });
            if (!exists)
                return candidate;
        }
        throw new Error(`Could not generate unique quotation number after ${MAX_ATTEMPTS} attempts`);
    }
};
exports.QuotationNumberService = QuotationNumberService;
exports.QuotationNumberService = QuotationNumberService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, sequelize_1.InjectModel)(quotation_entity_1.Quotation)),
    __metadata("design:paramtypes", [Object])
], QuotationNumberService);
//# sourceMappingURL=quotation-number.service.js.map