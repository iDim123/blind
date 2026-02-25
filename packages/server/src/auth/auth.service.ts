import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, GameStatus } from '@blind/shared';
import { LoginDto } from './dto/login.dto';
import { SetProfileDto } from './dto/set-profile.dto';

export interface JwtPayload {
  sub: number; // userId
  role: UserRole;
  gameId?: number;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async loginAdmin(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (!user || user.role !== 'ADMIN') {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Пароль не установлен');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: { increment: 1 } },
      });
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    // Reset failed login count
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0 },
    });

    const payload: JwtPayload = { sub: user.id, role: UserRole.ADMIN };
    const accessToken = this.jwtService.sign(payload);

    // Save session
    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        isActive: true,
      },
    });

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    };
  }
  async joinByQr(qrToken: string) {
    const game = await this.prisma.game.findUnique({
      where: { qrToken },
    });

    if (!game) {
      throw new NotFoundException('Игра не найдена');
    }

    if (game.status !== 'CREATED' && game.status !== 'STARTED') {
      throw new ConflictException('Игра уже завершена');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const count = await tx.playerProfile.count({
        where: { gameId: game.id },
      });

      const num = count + 1;
      if (num > game.playersCount) {
        throw new ConflictException('Все места в игре заняты');
      }

      const uname = `p${num}_game${game.id}_${uuidv4().slice(0, 8)}`;

      const user = await tx.user.create({
        data: {
          username: uname,
          role: 'PLAYER',
          status: 'ACTIVE',
        },
      });

      const placeholderNickname = `__pending_${user.id}`;

      const profile = await tx.playerProfile.create({
        data: {
          userId: user.id,
          gameId: game.id,
          nickname: placeholderNickname,
          avatarId: 0,
        },
      });

      return { user, profile, playerNumber: num };
    });

    const payload: JwtPayload = {
      sub: result.user.id,
      role: UserRole.PLAYER,
      gameId: game.id,
    };
    const accessToken = this.jwtService.sign(payload);

    await this.prisma.session.create({
      data: {
        userId: result.user.id,
        gameId: game.id,
        token: accessToken,
        isActive: true,
      },
    });

    return {
      accessToken,
      user: {
        id: result.user.id,
        username: result.user.username,
        email: null,
        role: result.user.role,
        status: result.user.status,
      },
      needsProfile: true,
      gameId: game.id,
      playerNumber: result.playerNumber,
    };
  }

  async setProfile(userId: number, gameId: number, dto: SetProfileDto) {
    // Check nickname uniqueness within game (exclude pending placeholders)
    const existing = await this.prisma.playerProfile.findFirst({
      where: {
        gameId,
        nickname: dto.nickname,
        NOT: { userId },
      },
    });

    if (existing) {
      throw new ConflictException('Это имя уже занято, выберите другое');
    }

    // Ensure nickname is not a placeholder format
    if (dto.nickname.startsWith('__pending_')) {
      throw new ConflictException('Недопустимое имя');
    }

    const profile = await this.prisma.playerProfile.updateMany({
      where: { userId, gameId },
      data: {
        nickname: dto.nickname,
        avatarId: dto.avatarId,
      },
    });

    if (profile.count === 0) {
      throw new NotFoundException('Профиль не найден');
    }

    return this.prisma.playerProfile.findFirst({
      where: { userId, gameId },
    });
  }

  async logoutAllPlayers(gameId: number) {
    await this.prisma.session.updateMany({
      where: {
        gameId,
        isActive: true,
        user: { role: 'PLAYER' },
      },
      data: { isActive: false },
    });
  }

  async validateSession(userId: number, token: string): Promise<boolean> {
    const session = await this.prisma.session.findFirst({
      where: {
        userId,
        token,
        isActive: true,
      },
    });
    return !!session;
  }

  async createAdminUser(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { username: 'admin' },
    });

    if (existing) {
      throw new ConflictException('Администратор уже существует');
    }

    const existingEmail = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: 'admin',
        email,
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    return user;
  }
}
