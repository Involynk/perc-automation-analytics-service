import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { PromiseEntity } from '@perc/shared';

@Injectable()
export class PromiseEngine {
  private readonly logger = new Logger(PromiseEngine.name);

  constructor(
    @InjectRepository(PromiseEntity) private promiseRepo: Repository<PromiseEntity>,
  ) {}

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
}
