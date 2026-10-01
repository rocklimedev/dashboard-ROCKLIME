import { CreateProductMetaInput, ProductMetaService } from './product-meta.service';
export declare class ProductMetaController {
    private readonly productMetaService;
    constructor(productMetaService: ProductMetaService);
    create(dto: CreateProductMetaInput): Promise<import("./entities/product-meta.entity").ProductMeta>;
    findAll(): Promise<import("./entities/product-meta.entity").ProductMeta[]>;
    findOne(id: string): Promise<import("./entities/product-meta.entity").ProductMeta>;
    update(id: string, dto: Partial<CreateProductMetaInput>): Promise<import("./entities/product-meta.entity").ProductMeta>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
