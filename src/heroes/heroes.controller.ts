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
import { HeroesService } from './heroes.service';
import { CreateHeroDto } from './dto/create-hero.dto';
import { UpdateHeroDto } from './dto/update-hero.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

@Controller('heroes')
export class HeroesController {
  constructor(private readonly heroesService: HeroesService) {}

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Post()
  create(@Body() dto: CreateHeroDto, @Req() req: AuthenticatedRequest) {
    return this.heroesService.create(dto, req.user!.id);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.heroesService.findAll(req.user!.role);
  }

  @Roles(UserRole.ADMIN)
  @Get('deleted')
  findDeleted() {
    return this.heroesService.findDeleted();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.heroesService.findOne(id, req.user!.role);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateHeroDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.heroesService.update(id, dto, req.user!.id);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Patch(':id/publish')
  publish(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.heroesService.publish(id, req.user!.id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/archive')
  archive(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.heroesService.archive(id, req.user!.id);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.heroesService.remove(id, req.user!.id);
  }
}
