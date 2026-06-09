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

@ApiTags('Attributes')
@ApiBearerAuth('access-token')
@Controller('heroes/:heroId/attributes')
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Post()
  @ApiOperation({ summary: 'Create an attribute for a hero' })
  @ApiParam({ name: 'heroId', description: 'Hero UUID' })
  @ApiResponse({ status: 201, description: 'Attribute created' })
  @ApiResponse({ status: 400, description: 'Bad request — invalid data or archived hero' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden — insufficient role' })
  @ApiResponse({ status: 404, description: 'Hero not found' })
  @ApiResponse({ status: 409, description: 'Attribute already exists' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  create(
    @Param('heroId') heroId: string,
    @Body() dto: CreateAttributeDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.attributesService.create(heroId, dto, req.user!.id);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @Get()
  @ApiOperation({ summary: 'List attributes of a hero' })
  @ApiParam({ name: 'heroId', description: 'Hero UUID' })
  @ApiResponse({ status: 200, description: 'List of attributes' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden — insufficient role' })
  @ApiResponse({ status: 404, description: 'Hero not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  findAll(@Param('heroId') heroId: string, @Req() req: AuthenticatedRequest) {
    return this.attributesService.findAll(heroId, req.user!.role);
  }

  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @Patch(':id')
  @ApiOperation({ summary: 'Update an attribute' })
  @ApiParam({ name: 'heroId', description: 'Hero UUID' })
  @ApiParam({ name: 'id', description: 'Attribute UUID' })
  @ApiResponse({ status: 200, description: 'Attribute updated' })
  @ApiResponse({ status: 400, description: 'Bad request — invalid data or archived hero' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden — insufficient role' })
  @ApiResponse({ status: 404, description: 'Attribute not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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
  @ApiParam({ name: 'heroId', description: 'Hero UUID' })
  @ApiParam({ name: 'id', description: 'Attribute UUID' })
  @ApiResponse({ status: 200, description: 'Attribute deleted' })
  @ApiResponse({ status: 400, description: 'Bad request — archived hero' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Attribute not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  remove(
    @Param('heroId') heroId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.attributesService.remove(heroId, id, req.user!.id);
  }
}
