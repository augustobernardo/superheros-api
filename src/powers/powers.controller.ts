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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

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
  @ApiResponse({ status: 201, description: 'Power created' })
  @ApiResponse({ status: 409, description: 'Power already exists' })
  create(
    @Param('heroId') heroId: string,
    @Body() dto: CreatePowerDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.powersService.create(heroId, dto, req.user!.id);
  }

  @Get()
  @ApiOperation({ summary: 'List powers of a hero' })
  @ApiResponse({ status: 200, description: 'List of powers' })
  findAll(@Param('heroId') heroId: string) {
    return this.powersService.findAll(heroId);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a power' })
  @ApiResponse({ status: 200, description: 'Power updated' })
  @ApiResponse({ status: 404, description: 'Power not found' })
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
  @ApiResponse({ status: 200, description: 'Power deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(
    @Param('heroId') heroId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.powersService.remove(heroId, id, req.user!.id);
  }
}
