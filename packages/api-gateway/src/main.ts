import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  app.enableCors();
  await app.listen(process.env.PORT || 3000);
  console.log(`API Gateway running on port ${process.env.PORT || 3000}`);
}
bootstrap();
