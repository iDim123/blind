import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateGameDto } from './dto/create-game.dto';

@Injectable()
export class GameService {
  constructor(private prisma: PrismaService) {}

  async createGame(dto: CreateGameDto) {
    const qrToken = uuidv4();

    const game = await this.prisma.game.create({
      data: {
        name: dto.name,
        playersCount: dto.playersCount,
        groupsCount: dto.groupsCount,
        playersByGroups: dto.playersByGroups || null,
        stepsCount: dto.stepsCount,
        isOpen: dto.isOpen,
        status: 'CREATED',
        qrToken,
      },
    });

    // Create groups
    const groupData = Array.from({ length: dto.groupsCount }, (_, i) => ({
      gameId: game.id,
      groupIndex: i + 1,
      currentStep: 1,
      isFinished: false,
    }));

    await this.prisma.group.createMany({ data: groupData });

    const gameWithGroups = await this.prisma.game.findUnique({
      where: { id: game.id },
      include: { groups: true },
    });

    return gameWithGroups;
  }

  async getGameList() {
    return this.prisma.game.findMany({
      orderBy: { id: 'desc' },
      include: {
        groups: {
          orderBy: { groupIndex: 'asc' },
        },
      },
    });
  }

  async getGameById(id: number) {
    const game = await this.prisma.game.findUnique({
      where: { id },
      include: {
        groups: {
          orderBy: { groupIndex: 'asc' },
          include: {
            playerProfiles: true,
          },
        },
        playerProfiles: true,
      },
    });

    if (!game) {
      throw new NotFoundException('Игра не найдена');
    }

    return game;
  }

  async startGame(gameId: number) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: {
        groups: { orderBy: { groupIndex: 'asc' } },
        playerProfiles: true,
      },
    });

    if (!game) {
      throw new NotFoundException('Игра не найдена');
    }

    if (game.status !== 'CREATED') {
      throw new ConflictException('Игру можно начать только из статуса CREATED');
    }

    // TODO: Фаза 4 — распределение игроков по группам, генерация пар, создание StepRound и PlayerDecision

    await this.prisma.game.update({
      where: { id: gameId },
      data: { status: 'STARTED' },
    });

    return { success: true, gameId };
  }

  async stopGame(gameId: number) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new NotFoundException('Игра не найдена');
    }

    if (game.status !== 'STARTED') {
      throw new ConflictException('Остановить можно только начатую игру');
    }

    await this.prisma.game.update({
      where: { id: gameId },
      data: { status: 'STOPPED' },
    });

    // Mark all unfinished groups as finished
    await this.prisma.group.updateMany({
      where: { gameId, isFinished: false },
      data: { isFinished: true },
    });

    return { success: true, gameId };
  }
}