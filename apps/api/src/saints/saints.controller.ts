import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { SaintsService } from './saints.service';

@ApiTags('saints')
@Public()
@Controller('saints')
export class SaintsController {
  constructor(private readonly saintsService: SaintsService) {}

  @Get()
  list(@Query('language') language = 'es') {
    return this.saintsService.list(language);
  }

  @Get('today')
  today(@Query('language') language = 'es') {
    return this.saintsService.getSaintOfTheDay(language);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.saintsService.getById(id);
  }
}
