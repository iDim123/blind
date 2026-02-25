import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthService } from '../auth/auth.service';
import { CreateAdminCommand } from './create-admin.command';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    JwtModule.register({
      secret: 'cli-dummy-secret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [CreateAdminCommand, AuthService],
})
export class CommandModule {}
