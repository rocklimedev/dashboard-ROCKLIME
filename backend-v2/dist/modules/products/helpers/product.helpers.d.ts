import { Keyword } from '../entities/keyword.entity';
export declare const COMPANY_CODE_META_ID = "d11da9f9-3f2e-4536-8236-9671200cca4a";
export declare function parseJsonSafely<T = any>(input: unknown, fallback: T, context?: string): T;
export declare function generateProductCode({ companyCode, }: {
    brandId?: string;
    categoryId?: string;
    companyCode?: string;
}): Promise<string>;
export declare const getKeywordInclude: () => {
    model: typeof Keyword;
    as: string;
    attributes: string[];
    through: {
        attributes: string[];
    };
};
export declare const normalizeKeywords: (raw?: any[]) => {
    id: any;
    keyword: any;
}[];
export declare const buildMetaDetails: (metaObj: Record<string, any>, metaMap: Record<string, any>) => {
    id: string;
    title: any;
    slug: any;
    value: string;
    fieldType: any;
    unit: any;
}[];
export declare function fetchMetaMapForProducts(products: any[]): Promise<{
    [k: string]: any;
}>;
export declare function enrichProducts(products: any, options?: {
    metaMap?: Record<string, any>;
}): Promise<any>;
export declare const cleanKeywordIds: (keywordIds?: string[] | string) => string[];
