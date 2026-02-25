import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUserById(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user;
  }

  async getPlayerProfile(userId: number, gameId: number) {
    return this.prisma.playerProfile.findFirst({
      where: { userId, gameId },
      include: { user: true },
    });
  }

  async getGamePlayers(gameId: number) {
    return this.prisma.playerProfile.findMany({
      where: { gameId },
      include: { user: true },
      orderBy: { id: 'asc' },
    });
  }
}