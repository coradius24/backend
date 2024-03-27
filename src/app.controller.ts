import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
@Controller('')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/ping')
  getPingResponse(): string {
    return this.appService.getHello();
  }
}
