import { Controller, Get, Post, Put, Param, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { MeetingService } from './meeting.service';

@Controller('api/meetings')
export class MeetingController {
  constructor(
    private supabase: SupabaseClient,
    private meetingService: MeetingService,
  ) {}

  @Get('slots')
  async availableSlots(@Query('organizer_id') organizerId?: string, @Query('count') count?: string) {
    const slots = await this.meetingService.findAvailableSlots(organizerId || null, parseInt(count || '3'));
    return { slots };
  }

  @Get()
  async listMeetings(@Query('lead_id') leadId?: string, @Query('status') status?: string) {
    let query = this.supabase.from('meetings').select('*').order('scheduled_at', { ascending: true }).limit(100);
    if (leadId) query = query.eq('lead_id', leadId);
    if (status) query = query.eq('status', status);
    const { data } = await query;
    return data || [];
  }

  @Get(':id')
  async getMeeting(@Param('id') id: string) {
    const { data: meeting } = await this.supabase.from('meetings').select('*').eq('id', id).single();
    if (!meeting) throw new HttpException('Meeting not found', HttpStatus.NOT_FOUND);
    return meeting;
  }

  @Post()
  async bookMeeting(@Body() body: any) {
    if (!body.lead_id || !body.scheduled_at) {
      throw new HttpException('lead_id and scheduled_at are required', HttpStatus.BAD_REQUEST);
    }
    const result = await this.meetingService.bookMeeting(
      body.lead_id,
      body.scheduled_at,
      body.meeting_type || 'call',
      body.organizer_id,
    );
    return { status: 'success', meeting_id: result.meetingId, lead_id: result.leadId };
  }

  @Put(':id/reschedule')
  async reschedule(@Param('id') id: string, @Body() body: any) {
    if (!body.scheduled_at) throw new HttpException('scheduled_at is required', HttpStatus.BAD_REQUEST);
    await this.meetingService.rescheduleMeeting(id, body.scheduled_at);
    return { status: 'success', meeting_id: id };
  }

  @Put(':id/cancel')
  async cancel(@Param('id') id: string, @Body() body: any) {
    await this.meetingService.cancelMeeting(id, body?.reason);
    return { status: 'success', meeting_id: id };
  }

  @Put(':id/complete')
  async complete(@Param('id') id: string) {
    await this.meetingService.completeMeeting(id);
    return { status: 'success', meeting_id: id };
  }

  @Put(':id/missed')
  async missed(@Param('id') id: string) {
    await this.meetingService.markMissed(id);
    return { status: 'success', meeting_id: id };
  }

  @Post(':id/feedback')
  async feedback(@Param('id') id: string, @Body() body: any) {
    const rating = parseInt(body?.rating);
    if (!rating || rating < 1 || rating > 5) {
      throw new HttpException('rating must be between 1 and 5', HttpStatus.BAD_REQUEST);
    }
    await this.meetingService.collectFeedback(id, rating, body?.feedback);
    return { status: 'success', meeting_id: id };
  }

  @Post(':id/reminder')
  async reminder(@Param('id') id: string) {
    const { data: meeting } = await this.supabase.from('meetings').select('*').eq('id', id).single();
    if (!meeting) throw new HttpException('Meeting not found', HttpStatus.NOT_FOUND);

    await this.supabase.from('meetings').update({ reminder_sent: true }).eq('id', id);

    const { data: lead } = await this.supabase.from('leads').select('*').eq('id', meeting.lead_id).single();
    if (lead) {
      await this.meetingService.sendReminderMessage(meeting, lead);
    }
    return { status: 'success', meeting_id: id };
  }

  @Post(':id/feedback-request')
  async feedbackRequest(@Param('id') id: string) {
    await this.meetingService.requestFeedback(id);
    return { status: 'success', meeting_id: id };
  }
}
