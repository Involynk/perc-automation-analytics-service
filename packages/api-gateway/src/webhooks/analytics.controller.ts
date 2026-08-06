import { Controller, Get, Query, Res } from '@nestjs/common';
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

  @Get('conversions')
  async conversions() {
    return await this.analyticsService.getConversions();
  }

  @Get('response-times')
  async responseTimes() {
    return await this.analyticsService.getResponseTimes();
  }

  @Get('meetings')
  async meetings() {
    return await this.analyticsService.getMeetings();
  }

  @Get('revenue')
  async revenue() {
    return await this.analyticsService.getRevenue();
  }

  @Get('export')
  async export(@Res() res: any) {
    const csv = await this.analyticsService.exportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="perc-analytics.csv"');
    res.send(csv);
  }
}
