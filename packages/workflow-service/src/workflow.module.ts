import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Lead, WorkflowInstance, TimelineEvent, PromiseEntity, Notification, User,
  Channel, Conversation, Message, WorkflowHistory, EventType, Course, LeadCourse, Setting,
} from '@perc/shared';
import { PromiseEngine } from './engine/promise.engine';
import { RoutingEngine } from './engine/routing.engine';
import { WorkflowController } from './workflow.controller';

const entities = [
  User, Lead, Channel, Conversation, Message, TimelineEvent,
  WorkflowInstance, WorkflowHistory, PromiseEntity, Notification,
  EventType, Course, LeadCourse, Setting,
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      name: 'workflow',
      type: 'sqljs',
      location: process.env.DB_PATH || './perc_dev.db',
      entities,
      synchronize: true,
      autoSave: true,
    }),
    TypeOrmModule.forFeature(entities),
  ],
  controllers: [WorkflowController],
  providers: [PromiseEngine, RoutingEngine],
})
export class WorkflowModule {}
