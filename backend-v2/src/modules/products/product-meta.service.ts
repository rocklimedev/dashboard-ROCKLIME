import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProductMeta } from './entities/product-meta.entity';

export interface CreateProductMetaInput {
  title: string;
  slug?: string;
  fieldType: string;
  unit?: string;
}

@Injectable()
export class ProductMetaService {
  constructor(
    @InjectModel(ProductMeta) private readonly productMetaModel: typeof ProductMeta,
  ) {}

  create(dto: CreateProductMetaInput) {
    return this.productMetaModel.create(dto as any);
  }

  findAll() {
    return this.productMetaModel.findAll();
  }

  async findOne(id: string) {
    const meta = await this.productMetaModel.findByPk(id);
    if (!meta) throw new NotFoundException('Product meta field not found');
    return meta;
  }

  async update(id: string, dto: Partial<CreateProductMetaInput>) {
    const meta = await this.findOne(id);
    await meta.update(dto as any);
    return meta;
  }

  async remove(id: string) {
    const meta = await this.findOne(id);
    await meta.destroy();
    return { message: 'Product meta field deleted' };
  }
}
