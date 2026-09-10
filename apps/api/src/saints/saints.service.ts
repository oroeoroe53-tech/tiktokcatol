import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { SaintSummary } from '@faro/types';

@Injectable()
export class SaintsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(language: string): Promise<SaintSummary[]> {
    const saints = await this.prisma.saint.findMany({
      where: { language },
      orderBy: [{ feastMonth: 'asc' }, { feastDay: 'asc' }],
    });
    return saints.map((s) => this.toSummary(s));
  }

  async getById(id: string): Promise<SaintSummary> {
    const saint = await this.prisma.saint.findUnique({ where: { id } });
    if (!saint) throw new NotFoundException('Santo no encontrado');
    return this.toSummary(saint);
  }

  async getSaintOfTheDay(language: string): Promise<SaintSummary | null> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const saint = await this.prisma.saint.findFirst({
      where: { language, feastMonth: month, feastDay: day },
    });
    if (saint) return this.toSummary(saint);

    // Si no hay un santo del día concreto en el catálogo demo, se devuelve uno determinista
    // (mismo santo durante todo el día) para que la pantalla nunca quede vacía.
    const all = await this.prisma.saint.findMany({ where: { language }, orderBy: { id: 'asc' } });
    if (all.length === 0) return null;
    const dayOfYear = Math.floor(
      (Date.now() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000,
    );
    return this.toSummary(all[dayOfYear % all.length]!);
  }

  private toSummary(saint: any): SaintSummary {
    return {
      id: saint.id,
      name: saint.name,
      imageUrl: saint.imageUrl,
      feastMonth: saint.feastMonth,
      feastDay: saint.feastDay,
      shortBio: saint.shortBio,
      biography: saint.biography,
      virtues: saint.virtues,
      relatedPrayerId: saint.relatedPrayerId,
      language: saint.language,
    };
  }
}
