import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CityController } from './city/city.controller';
import { CityMiddleware } from './city/city.middleware';
import { CityModule } from './city/city.module';
import { HealthController } from './health.controller';
import { OrdersController } from './orders/orders.controller';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [CityModule, OrdersModule],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Every city-aware controller goes here. /health deliberately does not.
    consumer.apply(CityMiddleware).forRoutes(CityController, OrdersController);
  }
}
