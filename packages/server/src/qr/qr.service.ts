import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QrService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async generateQr(gameId: number): Promise<{ qrDataUrl: string; joinUrl: string }> {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new NotFoundException('Игра не найдена');
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const joinUrl = `${frontendUrl}/join/${game.qrToken}`;

    const qrDataUrl = await QRCode.toDataURL(joinUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return { qrDataUrl, joinUrl };
  }

  async getQrToken(gameId: number): Promise<{ qrToken: string; joinUrl: string }> {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new NotFoundException('Игра не найдена');
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const joinUrl = `${frontendUrl}/join/${game.qrToken}`;

    return { qrToken: game.qrToken, joinUrl };
  }
}