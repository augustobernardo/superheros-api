import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { HeroReportFilterDto } from './dto/hero-report-filter.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('heroes')
  @ApiOperation({ summary: 'Paginated heroes report with filters and sorting' })
  @ApiResponse({ status: 200, description: 'Paginated report of PUBLISHED heroes' })
  async getHeroesReport(@Query() filters: HeroReportFilterDto) {
    return this.reportsService.getHeroesReport(filters);
  }
}
