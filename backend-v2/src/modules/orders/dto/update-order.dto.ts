import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';

// Mirrors the original `updateOrderById` behaviour: any subset of fields
// may be sent and only the provided keys are validated/applied.
export class UpdateOrderDto extends PartialType(CreateOrderDto) {}
