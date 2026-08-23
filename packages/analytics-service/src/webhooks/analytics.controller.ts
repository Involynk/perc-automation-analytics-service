import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('api/analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('overview')
  async overview() {
    return await this.analyticsService.getOverview();
  }

  @Get('leads')
  async leads(@Query('by') by?: string) {
    return await this.analyticsService.getLeads(by || 'source');
  }

  /** Paginated lead list with engagement scores, followup counts, meeting counts */
  @Get('leads/list')
  async leadsList(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('source') source?: string,
    @Query('status') status?: string,
  ) {
    return await this.analyticsService.getLeadsList(
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
      source || undefined,
      status || undefined,
    );
  }

  @Get('conversions')
  async conversions() {
    return await this.analyticsService.getConversions();
  }

  @Get('response-times')
  async responseTimes() {
    return await this.analyticsService.getResponseTimes();
  }

  /** Hourly SLA trend for today from analytics_events */
  @Get('sla-trend')
  async slaTrend() {
    return await this.analyticsService.getSlaTrend();
  }

  @Get('meetings')
  async meetings() {
    return await this.analyticsService.getMeetings();
  }

  @Get('revenue')
  async revenue() {
    return await this.analyticsService.getRevenue();
  }

  /** Daily followup sent vs re-engaged count for last N days */
  @Get('followup-trend')
  async followupTrend(@Query('days') days?: string) {
    return await this.analyticsService.getFollowupTrend(days ? Number(days) : 7);
  }

  /** Daily new leads captured + meetings booked */
  @Get('acquisition-trend')
  async acquisitionTrend(@Query('days') days?: string) {
    return await this.analyticsService.getLeadAcquisitionTrend(days ? Number(days) : 7);
  }

  /** All quick KPI percentages computed from real DB data */
  @Get('kpi-summary')
  async kpiSummary() {
    return await this.analyticsService.getKpiSummary();
  }

  /** Full per-lead analytics aggregate */
  @Get('lead/:leadId')
  async leadAnalytics(@Param('leadId') leadId: string) {
    return await this.analyticsService.getLeadAnalytics(leadId);
  }

  /** Full timeline + meetings + followup log for a lead */
  @Get('lead/:leadId/timeline')
  async leadTimeline(@Param('leadId') leadId: string) {
    return await this.analyticsService.getLeadTimeline(leadId);
  }

  @Get('export')
  async export(@Res() res: any) {
    const csv = await this.analyticsService.exportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="perc-analytics.csv"');
    res.send(csv);
  }
}
