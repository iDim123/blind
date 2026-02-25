import { Controller, Get, Param, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@blind/shared';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Получить текущего пользователя' })
  async getMe(@Req() req: any) {
    const user = await this.userService.getUserById(req.user.sub);

    let profile = null;
    if (req.user.gameId) {
      profile = await this.userService.getPlayerProfile(req.user.sub, req.user.gameId);
    }

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      profile: profile
        ? {
            id: profile.id,
            nickname: profile.nickname,
            avatarId: profile.avatarId,
            gameId: profile.gameId,
            groupId: profile.groupId,
          }
        : null,
    };
  }

  @Get('game/:gameId/players')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Получить список игроков игры' })
  async getGamePlayers(@Param('gameId', ParseIntPipe) gameId: number) {
    const players = await this.userService.getGamePlayers(gameId);
    return players.map((p) => ({
      id: p.id,
      userId: p.userId,
      username: p.user.username,
      nickname: p.nickname,
      avatarId: p.avatarId,
      groupId: p.groupId,
    }));
  }
}