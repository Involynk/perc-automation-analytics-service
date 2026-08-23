import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { RoutingService } from './routing.service';
import { NotificationService } from './notification.service';
import { MeetingService } from './meeting.service';
import { AnalyticsService } from './analytics.service';
import { CommunicationClient, WorkflowClient } from './clients';
import { LeadCapturedListener } from './listeners/lead-captured.listener';
import { ResponseForwarderListener } from './listeners/response-forwarder.listener';
import { MeetingRequestedListener } from './listeners/meeting-requested.listener';
import { AnalyticsListener } from './listeners/analytics.listener';

@Module({
  providers: [
    CategoryService, RoutingService, NotificationService,
    MeetingService, AnalyticsService,
    CommunicationClient, WorkflowClient,
    LeadCapturedListener,
    ResponseForwarderListener,
    MeetingRequestedListener,
    AnalyticsListener,
  ],
  exports: [CategoryService, RoutingService, NotificationService, MeetingService, AnalyticsService],
})
export class EngineModule {}
