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

@ApiTags('Heroes')
@ApiBearerAuth('access-token')
@Controller('heroes')
export class HeroesController {
  constructor(private readonly heroesService: HeroesService) {}

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Post()
  @ApiOperation({ summary: 'Create a new hero (starts as DRAFT)' })
  @ApiResponse({ status: 201, description: 'Hero created' })
  @ApiResponse({ status: 400, description: 'Bad request — invalid data' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden — insufficient role' })
  @ApiResponse({ status: 409, description: 'Hero name already exists' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  create(@Body() dto: CreateHeroDto, @Req() req: AuthenticatedRequest) {
    return this.heroesService.create(dto, req.user!.id);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @Get()
  @ApiOperation({ summary: 'List heroes (VIEWER sees only PUBLISHED)' })
  @ApiResponse({ status: 200, description: 'List of heroes' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden — insufficient role' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  findAll(@Req() req: AuthenticatedRequest) {
    return this.heroesService.findAll(req.user!.role);
  }

  @Roles(UserRole.ADMIN)
  @Get('deleted')
  @ApiOperation({ summary: 'List soft-deleted heroes (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'List of deleted heroes' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  findDeleted() {
    return this.heroesService.findDeleted();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get hero details by ID' })
  @ApiParam({ name: 'id', description: 'Hero UUID' })
  @ApiResponse({ status: 200, description: 'Hero details' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 404, description: 'Hero not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.heroesService.findOne(id, req.user!.role);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Patch(':id')
  @ApiOperation({ summary: 'Update hero data' })
  @ApiParam({ name: 'id', description: 'Hero UUID' })
  @ApiResponse({ status: 200, description: 'Hero updated' })
  @ApiResponse({ status: 400, description: 'Bad request — invalid data' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden — insufficient role' })
  @ApiResponse({ status: 404, description: 'Hero not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateHeroDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.heroesService.update(id, dto, req.user!.id);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish a hero' })
  @ApiParam({ name: 'id', description: 'Hero UUID' })
  @ApiResponse({ status: 200, description: 'Hero published' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden — insufficient role' })
  @ApiResponse({ status: 404, description: 'Hero not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  publish(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.heroesService.publish(id, req.user!.id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive a hero (ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Hero UUID' })
  @ApiResponse({ status: 200, description: 'Hero archived' })
  @ApiResponse({ status: 400, description: 'Bad request — cannot archive' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Hero not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  archive(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.heroesService.archive(id, req.user!.id);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a hero (ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Hero UUID' })
  @ApiResponse({ status: 200, description: 'Hero deleted' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Hero not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.heroesService.remove(id, req.user!.id);
  }
}
