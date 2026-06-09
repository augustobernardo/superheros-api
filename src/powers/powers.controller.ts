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

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

@Controller('heroes/:heroId/powers')
export class PowersController {
  constructor(private readonly powersService: PowersService) {}

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Post()
  create(
    @Param('heroId') heroId: string,
    @Body() dto: CreatePowerDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.powersService.create(heroId, dto, req.user!.id);
  }

  @Get()
  findAll(@Param('heroId') heroId: string) {
    return this.powersService.findAll(heroId);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Patch(':id')
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
  remove(
    @Param('heroId') heroId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.powersService.remove(heroId, id, req.user!.id);
  }
}
