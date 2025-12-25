import { Controller, Get } from '@nestjs/common';

/* aws 배포 시 상태 확인을 위한 api -> target group [/health] */
@Controller('health')
export class HealthController {
  @Get()
  health() {
    return { ok: true };
  }
}
