import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SupabaseClient } from '@supabase/supabase-js';
import { seedDatabase } from '@perc/shared';
import { SupabaseModule } from './supabase/supabase.module';
import { AnalyticsController } from './webhooks/analytics.controller';
import { AnalyticsService } from './webhooks/analytics.service';
import { AnalyticsListener } from './webhooks/listeners/analytics.listener';
import { EngineModule } from './webhooks/engine.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    EventEmitterModule.forRoot(),
    SupabaseModule,
    EngineModule,
  ],
  controllers: [
    AnalyticsController,
  ],
  providers: [
    AnalyticsService,
    AnalyticsListener,
  ],
  exports: [
    AnalyticsService,
  ],
})
export class AnalyticsServiceModule implements OnModuleInit {
  constructor(private supabase: SupabaseClient) {}

  async onModuleInit() {
    await seedDatabase(this.supabase);
  }
}
