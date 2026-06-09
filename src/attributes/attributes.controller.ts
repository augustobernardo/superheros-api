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
import { AttributesService } from './attributes.service';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

@Controller('heroes/:heroId/attributes')
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Post()
  create(
    @Param('heroId') heroId: string,
    @Body() dto: CreateAttributeDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.attributesService.create(heroId, dto, req.user!.id);
  }

  @Get()
  findAll(@Param('heroId') heroId: string) {
    return this.attributesService.findAll(heroId);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Patch(':id')
  update(
    @Param('heroId') heroId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAttributeDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.attributesService.update(heroId, id, dto, req.user!.id);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(
    @Param('heroId') heroId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.attributesService.remove(heroId, id, req.user!.id);
  }
}
