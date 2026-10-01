import { Model as MongoModel } from 'mongoose';
import { Sequelize } from 'sequelize-typescript';
import { Order } from './entities/order.entity';
import { OrderDispatch } from './entities/order-dispatch.entity';
import { OrderCreditNote } from './entities/order-credit-note.entity';
import { Product } from '../products/entities/product.entity';
import { InventoryHistory } from '../products/entities/inventory-history.entity';
import { User } from '../users/entities/user.entity';
import { Customer } from '../customers/entities/customer.entity';
import { OrderItem } from './schemas/order-item.schema';
import { Comment } from './schemas/comment.schema';
import { OrderActivityLoggerService } from './order-activity-logger.service';
import { ActivityLogService } from '../engagement/activity-log.service';
import { AddCommentDto, CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
interface RequestUser {
    userId?: string;
    roles?: string[];
}
export declare class OrdersService {
    private readonly orderModel;
    private readonly productModel;
    private readonly inventoryHistoryModel;
    private readonly userModel;
    private readonly orderItemModel;
    private readonly commentModel;
    private readonly sequelize;
    private readonly orderActivityLogger;
    private readonly activityLog;
    constructor(orderModel: typeof Order, productModel: typeof Product, inventoryHistoryModel: typeof InventoryHistory, userModel: typeof User, orderItemModel: MongoModel<OrderItem>, commentModel: MongoModel<Comment>, sequelize: Sequelize, orderActivityLogger: OrderActivityLoggerService, activityLog: ActivityLogService);
    private computeTotals;
    private generateDailyOrderNumber;
    private reduceStockAndLog;
    private restoreStock;
    create(dto: CreateOrderDto, user: RequestUser): Promise<{
        message: string;
        order: Order;
    }>;
    findAll(query: any): Promise<{
        data: Order[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        items: any;
        id: string;
        orderNo: string;
        products: Record<string, any>[];
        status: string;
        priority: string;
        dueDate: string;
        followupDates: string[];
        source: string;
        description: string;
        createdFor: string;
        createdBy: string;
        assignedUserId: string;
        assignedTeamId: string;
        secondaryUserId: string;
        quotationId: string;
        shipTo: string;
        gatePassLink: string;
        invoiceLink: string;
        receivingDocumentLink: string;
        masterPipelineNo: string;
        previousOrderNo: string;
        shipping: number;
        gst: number;
        gstValue: number;
        extraDiscount: number;
        extraDiscountType: string;
        extraDiscountValue: number;
        finalAmount: number;
        amountPaid: number;
        secondaryUser: User;
        creator: User;
        assignedUser: User;
        customer: Customer;
        shippingAddress: import("../address/entities/address.entity").Address;
        quotation: import("../quotations/entities/quotation.entity").Quotation;
        dispatches: OrderDispatch[];
        creditNotes: OrderCreditNote[];
        activityLog: import("./entities/order-activity.entity").OrderActivity[];
        createdAt?: Date | any;
        updatedAt?: Date | any;
        deletedAt?: Date | any;
        version?: number | any;
        _attributes: Order;
        dataValues: Order;
        _creationAttributes: Order;
        isNewRecord: boolean;
        sequelize: import("sequelize").Sequelize;
        _model: import("sequelize").Model<Order, Order>;
    }>;
    count(): Promise<{
        success: boolean;
        total: number;
    }>;
    recent(limit?: number): Promise<Order[]>;
    updateStatus(id: string, dto: UpdateOrderStatusDto, user: RequestUser): Promise<{
        message: string;
        order: Order;
    }>;
    remove(id: string, user: RequestUser): Promise<{
        message: string;
    }>;
    getComments(orderId: string): Promise<{
        comments: (import("mongoose").FlattenMaps<Comment> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
    }>;
    addComment(orderId: string, dto: AddCommentDto, user: RequestUser): Promise<{
        message: string;
        comment: import("mongoose").Document<unknown, {}, Comment, {}, {}> & Comment & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    deleteComment(commentId: string, user: RequestUser): Promise<{
        message: string;
    }>;
    updateOrderById(): never;
    getFilteredOrders(): never;
    updateOrderTeam(): never;
    uploadInvoiceAndLinkOrder(): never;
    issueGatePass(): never;
    downloadInvoice(): never;
    downloadOrder(): never;
    getDownloadDocument(): never;
}
export {};
