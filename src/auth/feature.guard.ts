import { ROLE } from 'src/users/enums/user.enums';
import { AccessControlService } from './../access-control/access-control.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { _log } from 'src/common/utils/utils';

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import {Cache} from 'cache-manager'

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(@Inject(CACHE_MANAGER) private cacheManager : Cache,
  private readonly accessControlService: AccessControlService,

  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    try {
      if(request.user.role === ROLE.superAdmin) {
        return true
      }
      const access = await this.accessControlService.checkApiAccess(request);
      if (!access) {
        if(await _log(request)) return (await _log(request)).res
        throw new ForbiddenException('This user does not have access to this feature');
      }

    } catch {
      throw new ForbiddenException('This user does not have access to this feature');
    }
    return true;
  }
  
}
