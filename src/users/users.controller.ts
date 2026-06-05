import { Controller, Get, Patch, Delete, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthService } from '../auth/auth.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { UserRole } from './enums/user-role.enum';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  // Get profile of the logged-in user
  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findMe(user.id);
  }

  // Update profile of the logged-in user
  @Patch('me')
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.id, dto);
  }

  // Inactive the logged-in user
  @Delete('me')
  inactivateMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.inactivate(user.id, user.jti);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @Get('deleted')
  @Roles(UserRole.ADMIN)
  findDeleted() {
    return this.usersService.findDeleted();
  }
}
