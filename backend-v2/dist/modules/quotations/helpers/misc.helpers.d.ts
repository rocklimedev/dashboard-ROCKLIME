export declare function buildFloorsFromProducts(products: any[]): any[];
export declare const generateGroupId: () => string;
export declare const generateFloorId: () => string;
export declare const generateRoomId: (floorId?: string) => string;
export declare const META_SLUGS: {
    sellingPrice: string;
    companyCode: string;
    barcode: string;
    productGroup: string;
};
export declare function getMetaValue(meta: unknown, uuid: string): string | null;
export declare function extractFirstImageUrl(imagesField: unknown): string | null;
