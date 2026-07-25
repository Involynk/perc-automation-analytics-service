import { NestFactory } from '@nestjs/core';
import { WorkflowModule } from './workflow.module';

async function bootstrap() {
  const app = await NestFactory.create(WorkflowModule);
  await app.listen(process.env.WORKFLOW_SERVICE_PORT || 3002);
  console.log(`Workflow Service running on port ${process.env.WORKFLOW_SERVICE_PORT || 3002}`);
}
bootstrap();
