import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@perc/shared';
import { WhatsAppService } from './handlers/whatsapp.service';
import { InstagramService } from './handlers/instagram.service';
import { FacebookService } from './handlers/facebook.service';
import { EmailService } from './handlers/email.service';
import { ResponseEngine } from './response.engine';
import { CommunicationController } from './communication.controller';
import { ResponseController } from './response.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }), HttpModule],
  controllers: [CommunicationController, ResponseController],
  providers: [
    WhatsAppService,
    InstagramService,
    FacebookService,
    EmailService,
    ResponseEngine,
    { provide: SupabaseClient, useFactory: () => getSupabaseClient() },
  ],
})
export class CommunicationModule {}
