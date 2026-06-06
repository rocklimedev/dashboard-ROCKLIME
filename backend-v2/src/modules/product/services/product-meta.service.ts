import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { ProductMeta } from './entities/product-meta.entity';
import { Product } from '../product/entities/product.entity'; // Adjust path
import {
  CreateProductMetaDto,
  UpdateProductMetaDto,
} from './dto/product-meta.dto';

@Injectable()
export class ProductMetaService {
  constructor(
    @InjectModel(ProductMeta) private productMetaModel: typeof ProductMeta,
    @InjectModel(Product) private productModel: typeof Product,
  ) {}

  async create(createDto: CreateProductMetaDto) {
    // Check slug uniqueness
    if (createDto.slug) {
      const existing = await this.productMetaModel.findOne({
        where: { slug: createDto.slug },
      });
      if (existing) throw new ConflictException('Slug must be unique');
    }

    const productMeta = await this.productMetaModel.create(createDto);
    return { message: 'ProductMeta created successfully', productMeta };
  }

  async findAll() {
    return this.productMetaModel.findAll({
      attributes: ['id', 'title', 'slug', 'fieldType', 'unit', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: number) {
    const meta = await this.productMetaModel.findByPk(id, {
      attributes: ['id', 'title', 'slug', 'fieldType', 'unit', 'createdAt'],
    });
    if (!meta) throw new NotFoundException('ProductMeta not found');
    return meta;
  }

  async update(id: number, updateDto: UpdateProductMetaDto) {
    const meta = await this.findOne(id);

    // Check slug uniqueness if changed
    if (updateDto.slug && updateDto.slug !== meta.slug) {
      const existing = await this.productMetaModel.findOne({
        where: { slug: updateDto.slug },
      });
      if (existing) throw new ConflictException('Slug must be unique');
    }

    await meta.update(updateDto);
    return { message: 'ProductMeta updated successfully', productMeta: meta };
  }

  async remove(id: number) {
    const meta = await this.findOne(id);

    // Check if any product is using this meta
    const productsUsingMeta = await this.productModel.findAll({
      where: {
        meta: {
          [Op.contains]: { [meta.id]: { [Op.ne]: null } },
        },
      },
    });

    if (productsUsingMeta.length > 0) {
      throw new BadRequestException({
        message:
          'Cannot delete ProductMeta; it is referenced by one or more products',
        productIds: productsUsingMeta.map((p) => p.productId),
      });
    }

    await meta.destroy();
    return { message: 'ProductMeta deleted successfully' };
  }

  async findByTitle(title: string) {
    if (!title)
      throw new BadRequestException('Title query parameter is required');

    const metas = await this.productMetaModel.findAll({
      where: { title: { [Op.iLike]: `%${title}%` } },
      attributes: ['id', 'title', 'slug', 'fieldType', 'unit', 'createdAt'],
    });

    if (metas.length === 0) {
      throw new NotFoundException('No ProductMeta found with the given title');
    }
    return metas;
  }

  async findBySlug(slug: string) {
    if (!slug)
      throw new BadRequestException('Slug query parameter is required');

    const metas = await this.productMetaModel.findAll({
      where: { slug: { [Op.iLike]: `%${slug}%` } },
      attributes: ['id', 'title', 'slug', 'fieldType', 'unit', 'createdAt'],
    });

    if (metas.length === 0) {
      throw new NotFoundException('No ProductMeta found with the given slug');
    }
    return metas;
  }
}
