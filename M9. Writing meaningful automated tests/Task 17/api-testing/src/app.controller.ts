import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from './auth/jwt-auth.guard.ts';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('echo')
  @UseGuards(JwtAuthGuard)
  echoMessage(@Body() dto: CreateMessageDto) {
    return { echoed: dto.message };
  }
}
