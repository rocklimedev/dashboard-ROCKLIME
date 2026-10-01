export declare class CreateProductDto {
    name?: string;
    product_code?: string;
    quantity?: number;
    isMaster?: boolean | string;
    masterProductId?: string;
    variantOptions?: string | Record<string, any>;
    variantKey?: string;
    skuSuffix?: string;
    meta?: string | Record<string, any>;
    isFeatured?: boolean | string;
    status?: string;
    keywordIds?: string[];
    description?: string;
    tax?: string | number;
    alert_quantity?: string | number;
    categoryId?: string;
    brandId?: string;
    vendorId?: string;
    brand_parentcategoriesId?: string;
}
export declare class UpdateProductDto extends CreateProductDto {
    imagesToDelete?: string | string[];
}
export declare class AddStockDto {
    quantity: number;
    orderNo?: string;
    userId?: string;
    message?: string;
}
export declare class RemoveStockDto extends AddStockDto {
}
export declare class UpdateFeaturedDto {
    isFeatured: boolean;
}
export declare class ProductIdsDto {
    productIds: string[];
}
export declare class KeywordIdsDto {
    keywordIds: string[];
}
