import { Controller, Post, Body, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromiseEntity } from '@perc/shared';
import { PromiseEngine } from './engine/promise.engine';
import { RoutingEngine } from './engine/routing.engine';
import * as crypto from 'crypto';

@Controller('api/workflow')
export class WorkflowController {
  private readonly logger = new Logger(WorkflowController.name);

  constructor(
    private promiseEngine: PromiseEngine,
    private routingEngine: RoutingEngine,
    @InjectRepository(PromiseEntity) private promiseRepo: Repository<PromiseEntity>,
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

  @Post('promises')
  async createPromise(@Body() body: {
    lead_id: string;
    promise_type: string;
    scheduled_at: string;
    payload: Record<string, unknown>;
  }) {
    const id = crypto.randomUUID();
    const promise = await this.promiseRepo.save({
      id,
      lead_id: body.lead_id,
      promise_type: body.promise_type,
      status: 'pending',
      scheduled_at: body.scheduled_at,
      payload: JSON.stringify(body.payload),
      retry_count: 0,
      max_retries: 3,
      is_recurring: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any);
    this.logger.log(`Promise created: ${id} type=${body.promise_type} lead=${body.lead_id}`);
    return { status: 'ok', promise_id: promise.id };
  }
}
