import { ProductsService } from './products.service';
import { AddStockDto, CreateProductDto, KeywordIdsDto, ProductIdsDto, RemoveStockDto, UpdateFeaturedDto, UpdateProductDto } from './dto/product.dto';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    count(): Promise<{
        success: boolean;
        totalProducts: number;
    }>;
    checkCode(code: string): Promise<{
        exists: boolean;
    }>;
    lowStock(): never;
    topSelling(): never;
    search(): never;
    getAllCodes(): never;
    getAllCodesBrandWise(): never;
    findByCategory(categoryId: string): Promise<import("./entities/product.entity").Product[]>;
    findByBrand(brandId: string): Promise<import("./entities/product.entity").Product[]>;
    findByIds(dto: ProductIdsDto): Promise<{
        data: any;
        pagination: {
            total: any;
            page: number;
            limit: any;
            totalPages: number;
        };
    }>;
    bulkImport(): never;
    bulkInventoryUpdate(): never;
    create(dto: CreateProductDto, files: Express.Multer.File[]): Promise<{
        message: string;
        product: any;
    }>;
    findAll(query: any): Promise<{
        data: any;
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(productId: string): Promise<any>;
    update(productId: string, dto: UpdateProductDto, files: Express.Multer.File[]): Promise<{
        message: string;
        product: any;
    }>;
    remove(productId: string): Promise<{
        message: string;
    }>;
    updateFeatured(productId: string, dto: UpdateFeaturedDto): Promise<{
        message: string;
        product: import("./entities/product.entity").Product;
    }>;
    addStock(productId: string, dto: AddStockDto): Promise<{
        message: string;
        product: import("./entities/product.entity").Product;
        inventoryHistory: {
            id: string;
            action: string;
            change: number;
            quantityAfter: number;
            timestamp: any;
            orderNo: string;
            userId: string;
            message: string;
        };
    }>;
    removeStock(productId: string, dto: RemoveStockDto): Promise<{
        message: string;
        product: import("./entities/product.entity").Product;
        inventoryHistory: {
            id: string;
            action: string;
            change: number;
            quantityAfter: number;
            timestamp: any;
            orderNo: string;
            userId: string;
            message: string;
        };
    }>;
    getHistory(productId: string, query: any): Promise<{
        message: string;
        total: number;
        page: number;
        pages: number;
        history: {
            id: string;
            action: string;
            change: number;
            quantityAfter: number;
            timestamp: any;
            orderNo: string;
            userId: string;
            message: string;
        }[];
    }>;
    replaceKeywords(productId: string, dto: KeywordIdsDto): Promise<{
        message: string;
        keywords: any;
    }>;
    addKeywords(productId: string, dto: KeywordIdsDto): Promise<{
        message: string;
        keywords: import("./entities/keyword.entity").Keyword[];
    }>;
    removeKeyword(productId: string, keywordId: string): Promise<{
        message: string;
    }>;
    removeAllKeywords(productId: string): Promise<{
        message: string;
    }>;
}
