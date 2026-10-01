import { Sequelize } from 'sequelize-typescript';
import { Customer } from './entities/customer.entity';
import { Quotation } from '../quotations/entities/quotation.entity';
import { Order } from '../orders/entities/order.entity';
import { ActivityLogService } from '../engagement/activity-log.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
export declare class CustomersService {
    private readonly customerModel;
    private readonly quotationModel;
    private readonly orderModel;
    private readonly sequelize;
    private readonly activityLog;
    constructor(customerModel: typeof Customer, quotationModel: typeof Quotation, orderModel: typeof Order, sequelize: Sequelize, activityLog: ActivityLogService);
    create(dto: CreateCustomerDto, userId?: string): Promise<{
        success: boolean;
        data: any;
    }>;
    findAll(query: any): Promise<{
        success: boolean;
        data: any[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        success: boolean;
        data: any;
    }>;
    update(id: string, dto: UpdateCustomerDto): Promise<{
        success: boolean;
        data: any;
    }>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
