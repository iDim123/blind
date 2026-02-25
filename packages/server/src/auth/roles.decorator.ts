import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@blind/shared';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);