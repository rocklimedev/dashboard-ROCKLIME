import { Sequelize } from 'sequelize-typescript';
import { Product } from './entities/product.entity';
import { ProductMeta } from './entities/product-meta.entity';
import { InventoryHistory } from './entities/inventory-history.entity';
import { Keyword } from './entities/keyword.entity';
import { ProductKeyword } from './entities/product-keyword.entity';
import { User } from '../users/entities/user.entity';
import { UploadService } from '../../common/upload/upload.service';
import { AddStockDto, CreateProductDto, RemoveStockDto, UpdateFeaturedDto, UpdateProductDto } from './dto/product.dto';
export declare class ProductsService {
    private readonly productModel;
    private readonly productMetaModel;
    private readonly inventoryHistoryModel;
    private readonly keywordModel;
    private readonly productKeywordModel;
    private readonly userModel;
    private readonly sequelize;
    private readonly uploadService;
    constructor(productModel: typeof Product, productMetaModel: typeof ProductMeta, inventoryHistoryModel: typeof InventoryHistory, keywordModel: typeof Keyword, productKeywordModel: typeof ProductKeyword, userModel: typeof User, sequelize: Sequelize, uploadService: UploadService);
    create(dto: CreateProductDto, files?: Express.Multer.File[]): Promise<{
        message: string;
        product: any;
    }>;
    update(productId: string, dto: UpdateProductDto, files?: Express.Multer.File[]): Promise<{
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
    findByIds(productIds: string[]): Promise<{
        data: any;
        pagination: {
            total: any;
            page: number;
            limit: any;
            totalPages: number;
        };
    }>;
    findByCategory(categoryId: string): Promise<Product[]>;
    findByBrand(brandId: string): Promise<Product[]>;
    remove(productId: string): Promise<{
        message: string;
    }>;
    count(): Promise<{
        success: boolean;
        totalProducts: number;
    }>;
    checkCode(code: string): Promise<{
        exists: boolean;
    }>;
    updateFeatured(productId: string, dto: UpdateFeaturedDto): Promise<{
        message: string;
        product: Product;
    }>;
    addStock(productId: string, dto: AddStockDto): Promise<{
        message: string;
        product: Product;
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
        product: Product;
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
    addKeywords(productId: string, keywordIds: string[]): Promise<{
        message: string;
        keywords: Keyword[];
    }>;
    removeKeyword(productId: string, keywordId: string): Promise<{
        message: string;
    }>;
    removeAllKeywords(productId: string): Promise<{
        message: string;
    }>;
    replaceKeywords(productId: string, keywordIds: string[] | string): Promise<{
        message: string;
        keywords: any;
    }>;
    searchProducts(): never;
    getLowStockProducts(): never;
    getTopSellingProducts(): never;
    bulkImportProducts(): never;
    bulkInventoryUpdate(): never;
    getAllProductCodesBrandWise(): never;
    getAllProductCodes(): never;
    private serialize;
    private serializeHistory;
}
