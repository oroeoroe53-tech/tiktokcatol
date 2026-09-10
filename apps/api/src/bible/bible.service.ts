import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { BibleBookSummary, BibleVerseSummary } from '@faro/types';

@Injectable()
export class BibleService {
  constructor(private readonly prisma: PrismaService) {}

  async listBooks(language: string): Promise<BibleBookSummary[]> {
    const books = await this.prisma.bibleBook.findMany({
      where: { language },
      include: { _count: { select: { chapters: true } } },
      orderBy: { order: 'asc' },
    });
    return books.map((b) => ({
      id: b.id,
      name: b.name,
      testament: b.testament as BibleBookSummary['testament'],
      order: b.order,
      chapterCount: b._count.chapters,
    }));
  }

  async getChapter(bookId: string, chapterNumber: number): Promise<BibleVerseSummary[]> {
    const chapter = await this.prisma.bibleChapter.findUnique({
      where: { bookId_chapterNumber: { bookId, chapterNumber } },
      include: { verses: { orderBy: { verseNumber: 'asc' } } },
    });
    if (!chapter) throw new NotFoundException('Capítulo no encontrado');
    return chapter.verses.map((v) => ({
      id: v.id,
      bookId,
      chapterNumber,
      verseNumber: v.verseNumber,
      text: v.text,
      translation: v.translation,
    }));
  }

  async search(query: string, language: string, limit = 20): Promise<BibleVerseSummary[]> {
    const verses = await this.prisma.bibleVerse.findMany({
      where: {
        text: { contains: query, mode: 'insensitive' },
        chapter: { book: { language } },
      },
      include: { chapter: true },
      take: limit,
    });
    return verses.map((v) => ({
      id: v.id,
      bookId: v.chapter.bookId,
      chapterNumber: v.chapter.chapterNumber,
      verseNumber: v.verseNumber,
      text: v.text,
      translation: v.translation,
    }));
  }

  async getGospelOfTheDay(language: string): Promise<BibleVerseSummary[]> {
    // MVP: rota entre un conjunto fijo de pasajes evangélicos de ejemplo (ver seed).
    // En producción se integraría con un calendario litúrgico real (leccionario).
    const gospelBook = await this.prisma.bibleBook.findFirst({
      where: { language, name: { in: ['John', 'Juan'] } },
    });
    if (!gospelBook) return [];
    const chapters = await this.prisma.bibleChapter.findMany({
      where: { bookId: gospelBook.id },
      orderBy: { chapterNumber: 'asc' },
    });
    if (chapters.length === 0) return [];
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000,
    );
    const chapter = chapters[dayOfYear % chapters.length]!;
    return this.getChapter(gospelBook.id, chapter.chapterNumber);
  }

  async favorite(userId: string, verseId: string) {
    const verse = await this.prisma.bibleVerse.findUnique({ where: { id: verseId } });
    if (!verse) throw new NotFoundException('Versículo no encontrado');
    await this.prisma.bibleFavoriteVerse.upsert({
      where: { userId_verseId: { userId, verseId } },
      create: { userId, verseId },
      update: {},
    });
    return { favorite: true };
  }

  async unfavorite(userId: string, verseId: string) {
    await this.prisma.bibleFavoriteVerse.deleteMany({ where: { userId, verseId } });
    return { favorite: false };
  }

  async listFavorites(userId: string) {
    const rows = await this.prisma.bibleFavoriteVerse.findMany({
      where: { userId },
      include: { verse: { include: { chapter: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.verse.id,
      bookId: r.verse.chapter.bookId,
      chapterNumber: r.verse.chapter.chapterNumber,
      verseNumber: r.verse.verseNumber,
      text: r.verse.text,
      translation: r.verse.translation,
    }));
  }
}
