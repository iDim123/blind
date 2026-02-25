import {
  Controller, Get, Post, Body, Param, ParseIntPipe,
  UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { CreateGameDto } from './dto/create-game.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, WS_EVENTS, Decision } from '@blind/shared';

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

  @Get('current/player-data')
  @Roles(UserRole.PLAYER)
  @ApiOperation({ summary: 'Данные игрока для текущей игры' })
  async getPlayerData(@Request() req: any) {
    const { sub: userId, gameId } = req.user;
    return this.gameService.getPlayerGameData(userId, gameId);
  }

  @Post('current/make-decision')
  @Roles(UserRole.PLAYER)
  @ApiOperation({ summary: 'Принять решение' })
  async makeDecision(
    @Request() req: any,
    @Body() body: { decisionId: number; decision: Decision },
  ) {
    const { sub: userId, gameId } = req.user;
    const result = await this.gameService.makeDecision(
      userId, gameId, body.decisionId, body.decision,
    );

    if (result.allDecided && result.roundResult) {
      const { d1, d2, score } = result.roundResult;

      // Notify both players about round result
      const profile1 = await this.getProfileUserId(d1.playerProfileId);
      const profile2 = await this.getProfileUserId(d2.playerProfileId);

      if (profile1) {
        this.gameGateway.emitToUser(profile1, WS_EVENTS.ROUND_RESULT, {
          stepRoundId: result.stepRoundId,
          step: result.step,
          yourDecision: d1.decision,
          partnerDecision: d2.decision,
          yourResult: score.scoreA,
        });
      }

      if (profile2) {
        this.gameGateway.emitToUser(profile2, WS_EVENTS.ROUND_RESULT, {
          stepRoundId: result.stepRoundId,
          step: result.step,
          yourDecision: d2.decision,
          partnerDecision: d1.decision,
          yourResult: score.scoreB,
        });
      }
    }

    // Notify group about who is still deciding
    await this.emitWaitingPlayers(result.groupId, result.step, gameId);

    return { success: true };
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
    this.gameGateway.emitToGame(id, WS_EVENTS.GAME_STARTED, { gameId: id });
    return result;
  }

  @Post(':id/stop')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Остановить игру' })
  async stopGame(@Param('id', ParseIntPipe) id: number) {
    const result = await this.gameService.stopGame(id);
    this.gameGateway.emitToGame(id, WS_EVENTS.GAME_STOPPED, {
      message: 'Игра остановлена администратором',
    });
    return result;
  }

  // Helper: get userId from playerProfileId
  private async getProfileUserId(playerProfileId: number): Promise<number | null> {
    const profile = await this.gameService['prisma'].playerProfile.findUnique({
      where: { id: playerProfileId },
    });
    return profile?.userId || null;
  }

  // Helper: emit waiting players list
  private async emitWaitingPlayers(groupId: number, step: number, gameId: number) {
    const undecided = await this.gameService['prisma'].playerDecision.findMany({
      where: {
        stepRound: { groupId, step, isFinished: false },
        decision: null,
        isSkipped: false,
      },
      include: { playerProfile: true },
    });

    const waitingPlayers = undecided.map((d) => ({
      nickname: d.playerProfile.nickname,
      avatarId: d.playerProfile.avatarId,
    }));

    this.gameGateway.emitToGame(gameId, WS_EVENTS.DECISION_MADE, { waitingPlayers });
  }
}