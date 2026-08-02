import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { RoutingService } from './routing.service';
import { NotificationService } from './notification.service';
import { MeetingService } from './meeting.service';
import { CommunicationClient, WorkflowClient } from './clients';
import { LeadCapturedListener } from './listeners/lead-captured.listener';
import { ResponseForwarderListener } from './listeners/response-forwarder.listener';
import { MeetingRequestedListener } from './listeners/meeting-requested.listener';

@Module({
  providers: [
    CategoryService, RoutingService, NotificationService,
    MeetingService,
    CommunicationClient, WorkflowClient,
    LeadCapturedListener,
    ResponseForwarderListener,
    MeetingRequestedListener,
  ],
  exports: [CategoryService, RoutingService, NotificationService, MeetingService],
})
export class EngineModule {}
