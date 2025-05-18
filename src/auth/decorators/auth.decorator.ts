import { Role } from '../enums/role.enum';
import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ROLES_KEY } from '../constants/roles.constants';
import { RolesGuard } from '../guard/roles.guard';
import { AuthGuard } from '../guard/guard.guard';
export const Auth = (role: Role) => {
  return applyDecorators(
    SetMetadata(ROLES_KEY, [role]),
    UseGuards(AuthGuard, RolesGuard),
  );
};
