import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PromiseEntity } from '@perc/shared';
import * as http from 'http';

@Injectable()
export class PromiseEngine {
  private readonly logger = new Logger(PromiseEngine.name);
  private gatewayUrl: string;

  constructor(
    @InjectRepository(PromiseEntity) private promiseRepo: Repository<PromiseEntity>,
    config: ConfigService,
  ) {
    this.gatewayUrl = config.get<string>('API_GATEWAY_URL') || 'http://localhost:3000';
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async tick(): Promise<number> {
    const now = new Date().toISOString();
    const due = await this.promiseRepo.find({
      where: {
        status: 'pending',
        scheduled_at: LessThan(now) as any,
      } as any,
      take: 50,
    });

    for (const p of due) {
      try {
        await this.promiseRepo.update(p.id, { status: 'executing' });
        const payload = JSON.parse(p.payload || '{}');
        const action = payload.action || 'unknown';

        this.logger.log(`Executing promise ${p.id}: ${action} for lead ${p.lead_id}`);

        await this.execute(p);

        await this.promiseRepo.update(p.id, {
          status: 'completed',
          executed_at: new Date().toISOString(),
          result: JSON.stringify({ action, status: 'done' }),
        });
      } catch (err: any) {
        this.logger.error(`Promise ${p.id} failed: ${err.message}`);
        const retryCount = p.retry_count + 1;
        if (retryCount < p.max_retries) {
          const retryAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
          await this.promiseRepo.update(p.id, {
            status: 'pending',
            retry_count: retryCount,
            scheduled_at: retryAt,
            error_message: err.message,
          });
        } else {
          await this.promiseRepo.update(p.id, {
            status: 'failed',
            error_message: err.message,
          });
        }
      }
    }

    return due.length;
  }

  private async execute(p: PromiseEntity): Promise<void> {
    const payload = JSON.parse(p.payload || '{}');
    const action = payload.action || '';

    if (action === 'send_meeting_reminder' || p.promise_type === 'meeting_reminder') {
      await this.triggerGateway(`/api/meetings/${payload.meeting_id}/reminder`, 'POST');
      return;
    }

    if (action === 'request_meeting_feedback' || p.promise_type === 'feedback') {
      await this.triggerGateway(`/api/meetings/${payload.meeting_id}/feedback-request`, 'POST');
      return;
    }
  }

  private triggerGateway(path: string, method: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          host: this.host(this.gatewayUrl),
          port: this.port(this.gatewayUrl),
          path,
          method,
          timeout: 15000,
          headers: { 'Content-Type': 'application/json' },
        },
        (res) => {
          res.on('data', () => {});
          res.on('end', () => resolve());
        },
      );
      req.on('error', (err) => reject(err));
      req.on('timeout', () => req.destroy(new Error('timeout')));
      req.end();
    });
  }

  private host(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url.replace(/^https?:\/\//, '').split(':')[0];
    }
  }

  private port(url: string): number {
    try {
      return Number(new URL(url).port) || 80;
    } catch {
      return 3000;
    }
  }
}
