import { NestFactory } from '@nestjs/core';
import { AnalyticsServiceModule } from './analytics-service.module';

async function bootstrap() {
  const app = await NestFactory.create(AnalyticsServiceModule);
  app.enableCors();
  const port = process.env.PORT || 3007;
  await app.listen(port);
  console.log(`🚀 Analytics Service running on port ${port}`);
}
bootstrap();
