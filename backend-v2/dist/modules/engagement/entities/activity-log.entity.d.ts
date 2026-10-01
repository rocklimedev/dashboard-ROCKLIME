import { Model } from 'sequelize-typescript';
export declare const CONTEXT_TAGS: {
    readonly AUTH: "AUTH";
    readonly CRM: "CRM";
    readonly CATALOG: "CATALOG";
    readonly SALES: "SALES";
    readonly PROCUREMENT: "PROCUREMENT";
    readonly INVENTORY: "INVENTORY";
    readonly SYSTEM: "SYSTEM";
};
export declare const SUB_CONTEXTS: {
    readonly USER: "USER";
    readonly CUSTOMER: "CUSTOMER";
    readonly VENDOR: "VENDOR";
    readonly BRAND: "BRAND";
    readonly CATEGORY: "CATEGORY";
    readonly PRODUCT: "PRODUCT";
    readonly QUOTATION: "QUOTATION";
    readonly ORDER: "ORDER";
    readonly FIELD_GUIDED_SHEET: "FIELD_GUIDED_SHEET";
    readonly PURCHASE_ORDER: "PURCHASE_ORDER";
    readonly TEAM: "TEAM";
    readonly ADDRESS: "ADDRESS";
    readonly ROLE: "ROLE";
};
export declare class ActivityLog extends Model<ActivityLog> {
    activityLogId: string;
    userId: string;
    contextTag: string;
    subContext: string;
    action: string;
    entityId: string;
    entityName: string;
    description: string;
    severity: string;
    oldValues: Record<string, any>;
    newValues: Record<string, any>;
    metadata: Record<string, any>;
    ipAddress: string;
    userAgent: string;
}
