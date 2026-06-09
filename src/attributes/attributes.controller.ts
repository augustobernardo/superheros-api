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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

@ApiTags('Attributes')
@ApiBearerAuth('access-token')
@Controller('heroes/:heroId/attributes')
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Post()
  @ApiOperation({ summary: 'Create an attribute for a hero' })
  @ApiResponse({ status: 201, description: 'Attribute created' })
  @ApiResponse({ status: 409, description: 'Attribute already exists' })
  create(
    @Param('heroId') heroId: string,
    @Body() dto: CreateAttributeDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.attributesService.create(heroId, dto, req.user!.id);
  }

  @Get()
  @ApiOperation({ summary: 'List attributes of a hero' })
  @ApiResponse({ status: 200, description: 'List of attributes' })
  findAll(@Param('heroId') heroId: string) {
    return this.attributesService.findAll(heroId);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Patch(':id')
  @ApiOperation({ summary: 'Update an attribute' })
  @ApiResponse({ status: 200, description: 'Attribute updated' })
  @ApiResponse({ status: 404, description: 'Attribute not found' })
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
  @ApiOperation({ summary: 'Soft delete an attribute (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Attribute deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(
    @Param('heroId') heroId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.attributesService.remove(heroId, id, req.user!.id);
  }
}
