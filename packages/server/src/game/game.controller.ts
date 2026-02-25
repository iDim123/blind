import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { CreateGameDto } from './dto/create-game.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, WS_EVENTS } from '@blind/shared';

@ApiTags('Games')
@Controller('games')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class GameController {
  constructor(
    private gameService: GameService,
    private gameGateway: GameGateway,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Создать игру' })
  async createGame(@Body() dto: CreateGameDto) {
    return this.gameService.createGame(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Список игр' })
  async getGameList() {
    return this.gameService.getGameList();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Детальная информация об игре' })
  async getGame(@Param('id', ParseIntPipe) id: number) {
    return this.gameService.getGameById(id);
  }

  @Post(':id/start')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Начать игру' })
  async startGame(@Param('id', ParseIntPipe) id: number) {
    const result = await this.gameService.startGame(id);

    // Notify all players in the game that it started
    this.gameGateway.emitToGame(id, WS_EVENTS.GAME_STARTED, { gameId: id });

    return result;
  }

  @Post(':id/stop')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Остановить игру' })
  async stopGame(@Param('id', ParseIntPipe) id: number) {
    const result = await this.gameService.stopGame(id);

    // Notify all players that game is stopped
    this.gameGateway.emitToGame(id, WS_EVENTS.GAME_STOPPED, {
      message: 'Игра остановлена администратором',
    });

    return result;
  }
}
