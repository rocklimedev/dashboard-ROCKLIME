import { OrderActivity } from './entities/order-activity.entity';
export interface LogOrderActivityInput {
    orderId: string;
    orderNo: string;
    action: string;
    description?: string | null;
    oldValue?: Record<string, any> | null;
    newValue?: Record<string, any> | null;
    performedBy?: string | null;
    metadata?: Record<string, any> | null;
    ipAddress?: string | null;
}
export declare class OrderActivityLoggerService {
    private readonly orderActivityModel;
    private readonly logger;
    constructor(orderActivityModel: typeof OrderActivity);
    logOrderActivity(input: LogOrderActivityInput): Promise<void>;
}
