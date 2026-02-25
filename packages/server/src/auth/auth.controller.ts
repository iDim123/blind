import { Controller, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SetProfileDto } from './dto/set-profile.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { UserRole } from '@blind/shared';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Вход администратора' })
  async login(@Body() dto: LoginDto) {
    return this.authService.loginAdmin(dto);
  }

  @Post('join/:qrToken')
  @ApiOperation({ summary: 'Вход игрока по QR-коду' })
  async joinByQr(@Param('qrToken') qrToken: string) {
    return this.authService.joinByQr(qrToken);
  }

  @Post('set-profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Установка профиля игрока (никнейм и аватарка)' })
  async setProfile(@Req() req: any, @Body() dto: SetProfileDto) {
    return this.authService.setProfile(req.user.sub, req.user.gameId, dto);
  }

  @Post('logout-all-players')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Вылогинить всех игроков' })
  async logoutAllPlayers(@Body('gameId') gameId: number) {
    return this.authService.logoutAllPlayers(gameId);
  }
}