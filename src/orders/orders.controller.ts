import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { RequireFeature } from '../features/require-feature.decorator';
import { CreateOrderDto, CreateOrderSchema } from './create-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(@Body(new ZodValidationPipe(CreateOrderSchema)) dto: CreateOrderDto) {
    return this.orders.create(dto);
  }

  /** Express delivery slots for the next few hours. Only in cities with express_delivery on. */
  @Get('express-slots')
  @RequireFeature('express_delivery')
  expressSlots() {
    return this.orders.expressSlots();
  }

  /** Whole route is switched off in cities without live tracking. */
  @Get(':id/tracking')
  @RequireFeature('live_tracking')
  tracking(@Param('id') id: string) {
    return this.orders.tracking(id);
  }
}
