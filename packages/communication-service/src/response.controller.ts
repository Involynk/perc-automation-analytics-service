import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ResponseEvent } from '@perc/shared';
import { ResponseEngine } from './response.engine';

@Controller('api')
export class ResponseController {
  private readonly logger = new Logger(ResponseController.name);

  constructor(private responseEngine: ResponseEngine) {}

  @Post('response')
  async handleResponse(@Body() body: ResponseEvent): Promise<any> {
    this.logger.log(
      `Response event received: ${body?.trigger_event} → ${body?.target?.preferred_channel} (${body?.event_id})`,
    );
    try {
      return await this.responseEngine.handle(body);
    } catch (err: any) {
      this.logger.error(`Response engine error: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}
