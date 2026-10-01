import { OrdersService } from './orders.service';
import { AddCommentDto, CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    count(): Promise<{
        success: boolean;
        total: number;
    }>;
    recent(limit?: string): Promise<import("./entities/order.entity").Order[]>;
    getFiltered(): never;
    create(dto: CreateOrderDto, user: any): Promise<{
        message: string;
        order: import("./entities/order.entity").Order;
    }>;
    findAll(query: any): Promise<{
        data: import("./entities/order.entity").Order[];
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
        secondaryUser: import("../users/entities/user.entity").User;
        creator: import("../users/entities/user.entity").User;
        assignedUser: import("../users/entities/user.entity").User;
        customer: import("../customers/entities/customer.entity").Customer;
        shippingAddress: import("../address/entities/address.entity").Address;
        quotation: import("../quotations/entities/quotation.entity").Quotation;
        dispatches: import("./entities/order-dispatch.entity").OrderDispatch[];
        creditNotes: import("./entities/order-credit-note.entity").OrderCreditNote[];
        activityLog: import("./entities/order-activity.entity").OrderActivity[];
        createdAt?: Date | any;
        updatedAt?: Date | any;
        deletedAt?: Date | any;
        version?: number | any;
        _attributes: import("./entities/order.entity").Order;
        dataValues: import("./entities/order.entity").Order;
        _creationAttributes: import("./entities/order.entity").Order;
        isNewRecord: boolean;
        sequelize: import("sequelize").Sequelize;
        _model: import("sequelize").Model<import("./entities/order.entity").Order, import("./entities/order.entity").Order>;
    }>;
    update(): never;
    remove(id: string, user: any): Promise<{
        message: string;
    }>;
    updateStatus(id: string, dto: UpdateOrderStatusDto, user: any): Promise<{
        message: string;
        order: import("./entities/order.entity").Order;
    }>;
    updateTeam(): never;
    uploadInvoice(): never;
    issueGatePass(): never;
    downloadInvoice(): never;
    downloadOrder(): never;
    getDocument(): never;
    getComments(id: string): Promise<{
        comments: (import("mongoose").FlattenMaps<import("./schemas/comment.schema").Comment> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
    }>;
    addComment(id: string, dto: AddCommentDto, user: any): Promise<{
        message: string;
        comment: import("mongoose").Document<unknown, {}, import("./schemas/comment.schema").Comment, {}, {}> & import("./schemas/comment.schema").Comment & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    deleteComment(commentId: string, user: any): Promise<{
        message: string;
    }>;
}
