import { Controller, Delete, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { BibleService } from './bible.service';

@ApiTags('bible')
@Controller('bible')
export class BibleController {
  constructor(private readonly bibleService: BibleService) {}

  @Public()
  @Get('books')
  listBooks(@Query('language') language = 'es') {
    return this.bibleService.listBooks(language);
  }

  @Public()
  @Get('books/:bookId/chapters/:chapterNumber')
  getChapter(
    @Param('bookId') bookId: string,
    @Param('chapterNumber', ParseIntPipe) chapterNumber: number,
  ) {
    return this.bibleService.getChapter(bookId, chapterNumber);
  }

  @Public()
  @Get('search')
  search(@Query('q') query: string, @Query('language') language = 'es') {
    return this.bibleService.search(query ?? '', language);
  }

  @Public()
  @Get('gospel-of-the-day')
  gospelOfTheDay(@Query('language') language = 'es') {
    return this.bibleService.getGospelOfTheDay(language);
  }

  @UseGuards(JwtAuthGuard)
  @Get('favorites')
  listFavorites(@CurrentUser() user: AuthenticatedUser) {
    return this.bibleService.listFavorites(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verses/:id/favorite')
  favorite(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.bibleService.favorite(user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('verses/:id/favorite')
  unfavorite(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.bibleService.unfavorite(user.id, id);
  }
}
