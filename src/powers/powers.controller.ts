import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { PowersService } from './powers.service';
import { CreatePowerDto } from './dto/create-power.dto';
import { UpdatePowerDto } from './dto/update-power.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

@ApiTags('Powers')
@ApiBearerAuth('access-token')
@Controller('heroes/:heroId/powers')
export class PowersController {
  constructor(private readonly powersService: PowersService) {}

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Post()
  @ApiOperation({ summary: 'Create a power for a hero' })
  @ApiParam({ name: 'heroId', description: 'Hero UUID' })
  @ApiResponse({ status: 201, description: 'Power created' })
  @ApiResponse({
    status: 400,
    description: 'Bad request — invalid data or archived hero',
  })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden — insufficient role' })
  @ApiResponse({ status: 404, description: 'Hero not found' })
  @ApiResponse({ status: 409, description: 'Power already exists' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  create(
    @Param('heroId') heroId: string,
    @Body() dto: CreatePowerDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.powersService.create(heroId, dto, req.user!.id);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @Get()
  @ApiOperation({ summary: 'List powers of a hero' })
  @ApiParam({ name: 'heroId', description: 'Hero UUID' })
  @ApiResponse({ status: 200, description: 'List of powers' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden — insufficient role' })
  @ApiResponse({ status: 404, description: 'Hero not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  findAll(@Param('heroId') heroId: string, @Req() req: AuthenticatedRequest) {
    return this.powersService.findAll(heroId, req.user!.role);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a power' })
  @ApiParam({ name: 'heroId', description: 'Hero UUID' })
  @ApiParam({ name: 'id', description: 'Power UUID' })
  @ApiResponse({ status: 200, description: 'Power updated' })
  @ApiResponse({
    status: 400,
    description: 'Bad request — invalid data or archived hero',
  })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden — insufficient role' })
  @ApiResponse({ status: 404, description: 'Power not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  update(
    @Param('heroId') heroId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePowerDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.powersService.update(heroId, id, dto, req.user!.id);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a power (ADMIN only)' })
  @ApiParam({ name: 'heroId', description: 'Hero UUID' })
  @ApiParam({ name: 'id', description: 'Power UUID' })
  @ApiResponse({ status: 200, description: 'Power deleted' })
  @ApiResponse({ status: 400, description: 'Bad request — archived hero' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Power not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  remove(
    @Param('heroId') heroId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.powersService.remove(heroId, id, req.user!.id);
  }
}
