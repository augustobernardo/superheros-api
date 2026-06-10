import { Controller, Get, Query } from '@nestjs/common';
import { BattlesService, PublisherBattleResult } from './battles.service';
import { BattleQueryDto } from './dto/battle-query.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Battles')
@ApiBearerAuth('access-token')
@Controller('battles')
export class BattlesController {
  constructor(private readonly battlesService: BattlesService) {}

  @Get()
  @ApiOperation({ summary: 'Battle between two publishers (3 result levels)' })
  @ApiResponse({ status: 200, description: 'Battle results with pagination' })
  @ApiResponse({ status: 400, description: 'Invalid publisher IDs' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async battle(@Query() query: BattleQueryDto): Promise<PublisherBattleResult> {
    return this.battlesService.battle(
      query.publisherAId,
      query.publisherBId,
      query.page,
      query.limit,
    );
  }
}
