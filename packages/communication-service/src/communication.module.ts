import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { WhatsAppService } from './handlers/whatsapp.service';
import { InstagramService } from './handlers/instagram.service';
import { FacebookService } from './handlers/facebook.service';
import { EmailService } from './handlers/email.service';
import { CommunicationController } from './communication.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }), HttpModule],
  controllers: [CommunicationController],
  providers: [WhatsAppService, InstagramService, FacebookService, EmailService],
})
export class CommunicationModule {}
