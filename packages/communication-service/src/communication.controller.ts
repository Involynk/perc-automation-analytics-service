import { Controller, Post, Body } from '@nestjs/common';
import { WhatsAppService } from './handlers/whatsapp.service';
import { InstagramService } from './handlers/instagram.service';
import { FacebookService } from './handlers/facebook.service';
import { EmailService } from './handlers/email.service';

@Controller('api/messages')
export class CommunicationController {
  constructor(
    private whatsapp: WhatsAppService,
    private instagram: InstagramService,
    private facebook: FacebookService,
    private email: EmailService,
  ) {}

  @Post('send/whatsapp')
  sendWhatsApp(@Body() body: { to: string; text: string }) {
    return this.whatsapp.sendText(body.to, body.text);
  }

  @Post('send/instagram')
  sendInstagram(@Body() body: { recipient_id: string; text: string }) {
    return this.instagram.sendText(body.recipient_id, body.text);
  }

  @Post('send/facebook')
  sendFacebook(@Body() body: { recipient_id: string; text: string }) {
    return this.facebook.sendText(body.recipient_id, body.text);
  }

  @Post('send/email')
  sendEmail(@Body() body: { to: string; subject: string; text: string }) {
    return this.email.sendReply(body.to, body.text, body.subject);
  }
}
