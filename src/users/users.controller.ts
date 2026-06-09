import { Controller, Get, Patch, Delete, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthService } from '../auth/auth.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { UserRole } from './enums/user-role.enum';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get profile of the logged-in user' })
  @ApiResponse({ status: 200, description: 'User profile returned' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findMe(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update profile of the logged-in user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.id, dto);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Inactivate the logged-in user (soft delete)' })
  @ApiResponse({ status: 200, description: 'User inactivated successfully' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  inactivateMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.inactivate(user.id, user.jti);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all active users (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'List of users returned' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('deleted')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List soft-deleted users (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'List of deleted users returned' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findDeleted() {
    return this.usersService.findDeleted();
  }
}
