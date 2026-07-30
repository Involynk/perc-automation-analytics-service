import { Controller, Post, Body, Logger } from '@nestjs/common';
import { WhatsAppService } from './handlers/whatsapp.service';
import { InstagramService } from './handlers/instagram.service';
import { FacebookService } from './handlers/facebook.service';
import { EmailService } from './handlers/email.service';

@Controller('api/messages')
export class CommunicationController {
  private readonly logger = new Logger(CommunicationController.name);

  constructor(
    private whatsapp: WhatsAppService,
    private instagram: InstagramService,
    private facebook: FacebookService,
    private email: EmailService,
  ) {}

  @Post('send')
  async send(@Body() body: { channel: string; to: string; text: string; lead_id?: string }) {
    this.logger.log(`Send request: channel=${body.channel} to=${body.to} lead_id=${body.lead_id}`);

    try {
      switch (body.channel) {
        case 'whatsapp': {
          const result = await this.whatsapp.sendText(body.to, body.text);
          return { success: true, channel: 'whatsapp', messageId: result?.messages?.[0]?.id };
        }
        case 'instagram': {
          const result = await this.instagram.sendText(body.to, body.text);
          return { success: true, channel: 'instagram', messageId: result?.message_id };
        }
        case 'facebook': {
          const result = await this.facebook.sendText(body.to, body.text);
          return { success: true, channel: 'facebook', messageId: result?.message_id };
        }
        case 'email': {
          const success = await this.email.sendReply(body.to, body.text);
          return { success, channel: 'email' };
        }
        default:
          return { success: false, channel: body.channel, error: `Unsupported channel: ${body.channel}` };
      }
    } catch (err: any) {
      this.logger.error(`Send failed for ${body.channel}: ${err.message}`);
      return { success: false, channel: body.channel, error: err.message };
    }
  }
}
