import { NestFactory } from '@nestjs/core';
import { CommunicationModule } from './communication.module';

async function bootstrap() {
  const app = await NestFactory.create(CommunicationModule);
  await app.listen(process.env.COMMUNICATION_SERVICE_PORT || 3001);
  console.log(`Communication Service running on port ${process.env.COMMUNICATION_SERVICE_PORT || 3001}`);
}
bootstrap();
