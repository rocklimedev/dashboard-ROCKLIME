import { ProductMeta } from './entities/product-meta.entity';
export interface CreateProductMetaInput {
    title: string;
    slug?: string;
    fieldType: string;
    unit?: string;
}
export declare class ProductMetaService {
    private readonly productMetaModel;
    constructor(productMetaModel: typeof ProductMeta);
    create(dto: CreateProductMetaInput): Promise<ProductMeta>;
    findAll(): Promise<ProductMeta[]>;
    findOne(id: string): Promise<ProductMeta>;
    update(id: string, dto: Partial<CreateProductMetaInput>): Promise<ProductMeta>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
