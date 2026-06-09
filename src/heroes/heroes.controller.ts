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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

@ApiTags('Heroes')
@ApiBearerAuth('access-token')
@Controller('heroes')
export class HeroesController {
  constructor(private readonly heroesService: HeroesService) {}

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Post()
  @ApiOperation({ summary: 'Create a new hero (starts as DRAFT)' })
  @ApiResponse({ status: 201, description: 'Hero created' })
  @ApiResponse({ status: 409, description: 'Hero name already exists' })
  create(@Body() dto: CreateHeroDto, @Req() req: AuthenticatedRequest) {
    return this.heroesService.create(dto, req.user!.id);
  }

  @Get()
  @ApiOperation({ summary: 'List heroes (VIEWER sees only PUBLISHED)' })
  @ApiResponse({ status: 200, description: 'List of heroes' })
  findAll(@Req() req: AuthenticatedRequest) {
    return this.heroesService.findAll(req.user!.role);
  }

  @Roles(UserRole.ADMIN)
  @Get('deleted')
  @ApiOperation({ summary: 'List soft-deleted heroes (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'List of deleted heroes' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findDeleted() {
    return this.heroesService.findDeleted();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get hero details by ID' })
  @ApiResponse({ status: 200, description: 'Hero details' })
  @ApiResponse({ status: 404, description: 'Hero not found' })
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.heroesService.findOne(id, req.user!.role);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Patch(':id')
  @ApiOperation({ summary: 'Update hero data' })
  @ApiResponse({ status: 200, description: 'Hero updated' })
  @ApiResponse({ status: 404, description: 'Hero not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateHeroDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.heroesService.update(id, dto, req.user!.id);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish a hero (validates Req. 19)' })
  @ApiResponse({ status: 200, description: 'Hero published' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  publish(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.heroesService.publish(id, req.user!.id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive a hero (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Hero archived' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  archive(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.heroesService.archive(id, req.user!.id);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a hero (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Hero deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.heroesService.remove(id, req.user!.id);
  }
}
