import { ActivityLog } from './entities/activity-log.entity';
export interface LogActivityInput {
    userId?: string | null;
    contextTag: string;
    subContext: string;
    action: string;
    entityId?: string | null;
    entityName?: string | null;
    description?: string | null;
    oldValues?: Record<string, any> | null;
    newValues?: Record<string, any> | null;
    metadata?: Record<string, any> | null;
    req?: {
        ip?: string;
        headers?: Record<string, any>;
    } | null;
}
export declare class ActivityLogService {
    private readonly activityLogModel;
    private readonly logger;
    constructor(activityLogModel: typeof ActivityLog);
    logActivity(input: LogActivityInput): Promise<void>;
}
