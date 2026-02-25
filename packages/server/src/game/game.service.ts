import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateGameDto } from './dto/create-game.dto';
import { Decision, calculateScore } from '@blind/shared';

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

    const groupData = Array.from({ length: dto.groupsCount }, (_, i) => ({
      gameId: game.id,
      groupIndex: i + 1,
      currentStep: 1,
      isFinished: false,
    }));

    await this.prisma.group.createMany({ data: groupData });

    return this.prisma.game.findUnique({
      where: { id: game.id },
      include: { groups: true },
    });
  }

  async getGameList() {
    return this.prisma.game.findMany({
      orderBy: { id: 'desc' },
      include: {
        groups: { orderBy: { groupIndex: 'asc' } },
      },
    });
  }

  async getGameById(id: number) {
    const game = await this.prisma.game.findUnique({
      where: { id },
      include: {
        groups: {
          orderBy: { groupIndex: 'asc' },
          include: { playerProfiles: true },
        },
        playerProfiles: true,
      },
    });

    if (!game) throw new NotFoundException('Игра не найдена');
    return game;
  }

  async startGame(gameId: number) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: {
        groups: { orderBy: { groupIndex: 'asc' } },
        playerProfiles: {
          where: {
            NOT: { nickname: { startsWith: '__pending_' } },
          },
        },
      },
    });

    if (!game) throw new NotFoundException('Игра не найдена');
    if (game.status !== 'CREATED') throw new ConflictException('Игру можно начать только из статуса CREATED');

    const profiles = game.playerProfiles;
    if (profiles.length < 2) throw new ConflictException('Нужно минимум 2 игрока с заполненным профилем');

    const groups = game.groups;

    // Distribute players across groups evenly
    const shuffled = [...profiles].sort(() => Math.random() - 0.5);
    const groupAssignments: Map<number, number[]> = new Map();
    groups.forEach((g) => groupAssignments.set(g.id, []));

    shuffled.forEach((player, i) => {
      const group = groups[i % groups.length];
      groupAssignments.get(group.id)!.push(player.id);
    });

    // Assign players to groups
    for (const [groupId, playerIds] of groupAssignments) {
      await this.prisma.playerProfile.updateMany({
        where: { id: { in: playerIds } },
        data: { groupId },
      });
    }

    // Generate StepRounds and PlayerDecisions for each group
    for (const group of groups) {
      const playerIds = groupAssignments.get(group.id)!;
      if (playerIds.length < 2) continue;

      const usedPairs: Set<string> = new Set();

      for (let step = 1; step <= game.stepsCount; step++) {
        const pairs = this.generatePairs(playerIds, usedPairs);

        for (const pair of pairs) {
          const stepRound = await this.prisma.stepRound.create({
            data: {
              groupId: group.id,
              step,
              isFinished: false,
            },
          });

          // Create decisions for both players in the pair
          await this.prisma.playerDecision.createMany({
            data: [
              { stepRoundId: stepRound.id, playerProfileId: pair[0] },
              { stepRoundId: stepRound.id, playerProfileId: pair[1] },
            ],
          });
        }

        // Handle odd player (skips this round)
        const pairedPlayerIds = new Set(pairs.flat());
        const skippedPlayers = playerIds.filter((id) => !pairedPlayerIds.has(id));

        for (const skippedId of skippedPlayers) {
          const stepRound = await this.prisma.stepRound.create({
            data: {
              groupId: group.id,
              step,
              isFinished: true, // immediately finished
            },
          });

          await this.prisma.playerDecision.create({
            data: {
              stepRoundId: stepRound.id,
              playerProfileId: skippedId,
              isSkipped: true,
              result: 0,
            },
          });
        }
      }
    }

    await this.prisma.game.update({
      where: { id: gameId },
      data: { status: 'STARTED' },
    });

    return { success: true, gameId };
  }

  private generatePairs(playerIds: number[], usedPairs: Set<string>): number[][] {
    const pairs: number[][] = [];
    const available = [...playerIds];

    // Shuffle
    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [available[i], available[j]] = [available[j], available[i]];
    }

    const used = new Set<number>();

    for (let i = 0; i < available.length; i++) {
      if (used.has(available[i])) continue;

      for (let j = i + 1; j < available.length; j++) {
        if (used.has(available[j])) continue;

        const pairKey = [available[i], available[j]].sort().join('-');

        if (!usedPairs.has(pairKey)) {
          pairs.push([available[i], available[j]]);
          usedPairs.add(pairKey);
          used.add(available[i]);
          used.add(available[j]);
          break;
        }
      }

      // If no unused pair found, allow reuse
      if (!used.has(available[i])) {
        for (let j = i + 1; j < available.length; j++) {
          if (used.has(available[j])) continue;
          pairs.push([available[i], available[j]]);
          used.add(available[i]);
          used.add(available[j]);
          break;
        }
      }
    }

    return pairs;
  }

  async getPlayerGameData(userId: number, gameId: number) {
    const game = await this.prisma.game.findUnique({ where: { id: gameId } });
    if (!game) throw new NotFoundException('Игра не найдена');

    const profile = await this.prisma.playerProfile.findFirst({
      where: { userId, gameId },
    });
    if (!profile) throw new NotFoundException('Профиль не найден');

    const group = profile.groupId
      ? await this.prisma.group.findUnique({ where: { id: profile.groupId } })
      : null;

    // Get all decisions for this player
    const decisions = await this.prisma.playerDecision.findMany({
      where: { playerProfileId: profile.id },
      include: {
        stepRound: {
          include: {
            playerDecisions: {
              include: {
                playerProfile: true,
              },
            },
          },
        },
      },
      orderBy: { stepRound: { step: 'asc' } },
    });

    const stepsData = decisions.map((d) => {
      const partnerDecision = d.stepRound.playerDecisions.find(
        (pd) => pd.playerProfileId !== profile.id,
      );

      let partner = undefined;
      if (partnerDecision && game.isOpen) {
        partner = {
          nickname: partnerDecision.playerProfile.nickname,
          avatarId: partnerDecision.playerProfile.avatarId,
          overallRating: null as number | null,
          recentRating: null as number | null,
          ratingAvailable: false,
        };
      } else if (partnerDecision) {
        partner = {
          nickname: partnerDecision.playerProfile.nickname,
          avatarId: partnerDecision.playerProfile.avatarId,
          overallRating: null,
          recentRating: null,
          ratingAvailable: false,
        };
      }

      return {
        step: d.stepRound.step,
        decisionId: d.id,
        decision: d.decision,
        result: d.result,
        isSkipped: d.isSkipped,
        partner,
      };
    });

    // Calculate total points
    const totalPoints = decisions.reduce((sum, d) => sum + (d.result || 0), 0);

    // Get waiting players for current step
    const currentStep = group?.currentStep || 1;
    let waitingPlayers: { nickname: string; avatarId: number }[] = [];

    if (group) {
      const undecided = await this.prisma.playerDecision.findMany({
        where: {
          stepRound: {
            groupId: group.id,
            step: currentStep,
            isFinished: false,
          },
          decision: null,
          isSkipped: false,
        },
        include: { playerProfile: true },
      });

      waitingPlayers = undecided.map((d) => ({
        nickname: d.playerProfile.nickname,
        avatarId: d.playerProfile.avatarId,
      }));
    }

    // Check if player is waiting for round to finish
    const currentDecision = decisions.find(
      (d) => d.stepRound.step === currentStep && !d.isSkipped,
    );
    const isWaitingForRoundFinish =
      !!currentDecision?.decision && !currentDecision.stepRound.isFinished;

    return {
      gameName: game.name,
      isOpen: game.isOpen,
      gameStatus: game.status,
      player: {
        nickname: profile.nickname,
        avatarId: profile.avatarId,
        totalPoints,
      },
      currentStep: group?.currentStep || 1,
      totalSteps: game.stepsCount,
      stepsData,
      isWaitingForRoundFinish,
      waitingPlayers,
    };
  }

  async makeDecision(userId: number, gameId: number, decisionId: number, decision: Decision) {
    const profile = await this.prisma.playerProfile.findFirst({
      where: { userId, gameId },
    });
    if (!profile) throw new NotFoundException('Профиль не найден');

    const playerDecision = await this.prisma.playerDecision.findUnique({
      where: { id: decisionId },
      include: {
        stepRound: {
          include: {
            playerDecisions: true,
            group: true,
          },
        },
      },
    });

    if (!playerDecision) throw new NotFoundException('Решение не найдено');
    if (playerDecision.playerProfileId !== profile.id) throw new BadRequestException('Это не ваше решение');
    if (playerDecision.decision) throw new ConflictException('Решение уже принято');
    if (playerDecision.isSkipped) throw new ConflictException('Этот раунд пропущен');

    // Save decision
    await this.prisma.playerDecision.update({
      where: { id: decisionId },
      data: { decision },
    });

    // Check if both players have decided
    const stepRound = playerDecision.stepRound;
    const allDecisions = await this.prisma.playerDecision.findMany({
      where: { stepRoundId: stepRound.id },
    });

    const allDecided = allDecisions.every((d) => d.decision || d.isSkipped);

    let roundResult = null;

    if (allDecided && allDecisions.length === 2) {
      const [d1, d2] = allDecisions;

      if (d1.decision && d2.decision) {
        const score = calculateScore(d1.decision as Decision, d2.decision as Decision);

        await this.prisma.playerDecision.update({
          where: { id: d1.id },
          data: { result: score.scoreA },
        });
        await this.prisma.playerDecision.update({
          where: { id: d2.id },
          data: { result: score.scoreB },
        });

        roundResult = { d1, d2, score };
      }

      // Mark step round as finished
      await this.prisma.stepRound.update({
        where: { id: stepRound.id },
        data: { isFinished: true },
      });

      // Check if all rounds in this step for this group are finished
      const allGroupRounds = await this.prisma.stepRound.findMany({
        where: {
          groupId: stepRound.groupId,
          step: stepRound.step,
        },
      });

      const allRoundsFinished = allGroupRounds.every((r) => r.isFinished);

      if (allRoundsFinished) {
        const group = stepRound.group;
        const game = await this.prisma.game.findUnique({ where: { id: gameId } });

        if (game && group.currentStep < game.stepsCount) {
          // Advance to next step
          await this.prisma.group.update({
            where: { id: group.id },
            data: { currentStep: group.currentStep + 1 },
          });
        } else {
          // Game finished for this group
          await this.prisma.group.update({
            where: { id: group.id },
            data: { isFinished: true },
          });

          // Check if all groups finished
          const allGroups = await this.prisma.group.findMany({
            where: { gameId },
          });

          if (allGroups.every((g) => g.isFinished)) {
            await this.prisma.game.update({
              where: { id: gameId },
              data: { status: 'FINISHED' },
            });
          }
        }
      }
    }

    return {
      allDecided,
      roundResult,
      stepRoundId: stepRound.id,
      groupId: stepRound.groupId,
      step: stepRound.step,
    };
  }

  async stopGame(gameId: number) {
    const game = await this.prisma.game.findUnique({ where: { id: gameId } });
    if (!game) throw new NotFoundException('Игра не найдена');
    if (game.status !== 'STARTED') throw new ConflictException('Остановить можно только начатую игру');

    await this.prisma.game.update({
      where: { id: gameId },
      data: { status: 'STOPPED' },
    });

    await this.prisma.group.updateMany({
      where: { gameId, isFinished: false },
      data: { isFinished: true },
    });

    return { success: true, gameId };
  }
}