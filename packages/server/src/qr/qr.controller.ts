import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { QrService } from './qr.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@blind/shared';

@ApiTags('QR')
@Controller('qr')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class QrController {
  constructor(private qrService: QrService) {}

  @Get(':gameId')
  @ApiOperation({ summary: 'Сгенерировать QR-код для игры' })
  async generateQr(@Param('gameId', ParseIntPipe) gameId: number) {
    return this.qrService.generateQr(gameId);
  }

  @Get(':gameId/token')
  @ApiOperation({ summary: 'Получить QR-токен и ссылку' })
  async getQrToken(@Param('gameId', ParseIntPipe) gameId: number) {
    return this.qrService.getQrToken(gameId);
  }
}