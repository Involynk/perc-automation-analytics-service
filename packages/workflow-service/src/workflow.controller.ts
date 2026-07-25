import { Controller, Post, Body } from '@nestjs/common';
import { PromiseEngine } from './engine/promise.engine';
import { RoutingEngine } from './engine/routing.engine';

@Controller('api/workflow')
export class WorkflowController {
  constructor(
    private promiseEngine: PromiseEngine,
    private routingEngine: RoutingEngine,
  ) {}

  @Post('route')
  async routeLead(@Body() body: { lead_id: string; source: string }) {
    await this.routingEngine.routeLead(body.lead_id, body.source);
    return { status: 'ok' };
  }

  @Post('tick')
  async tick() {
    const processed = await this.promiseEngine.tick();
    return { status: 'ok', promises_processed: processed };
  }
}
