import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { RoutingService } from './routing.service';
import { NotificationService } from './notification.service';

@Module({
  providers: [CategoryService, RoutingService, NotificationService],
  exports: [CategoryService, RoutingService, NotificationService],
})
export class EngineModule {}
