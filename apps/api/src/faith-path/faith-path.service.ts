import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { FaithPathObjective } from '@faro/types';
import type { FaithPathStepSummary, FaithPathSummary } from '@faro/types';

@Injectable()
export class FaithPathService {
  constructor(private readonly prisma: PrismaService) {}

  async selectObjective(userId: string, objective: FaithPathObjective) {
    const template = await this.prisma.faithPathTemplate.findUnique({ where: { objective } });
    if (!template) {
      throw new NotFoundException(
        `No existe todavía un itinerario de Camino de Fe para el objetivo "${objective}"`,
      );
    }
    await this.prisma.userPreferences.upsert({
      where: { userId },
      create: { userId, faithPathObjective: objective },
      update: { faithPathObjective: objective },
    });
    return this.prisma.faithPathProgress.upsert({
      where: { userId_templateId: { userId, templateId: template.id } },
      create: { userId, templateId: template.id },
      update: {},
    });
  }

  async getMyPath(userId: string): Promise<FaithPathSummary> {
    const preferences = await this.prisma.userPreferences.findUnique({ where: { userId } });
    if (!preferences?.faithPathObjective) {
      throw new BadRequestException('Todavía no has elegido un objetivo para tu Camino de Fe');
    }

    const template = await this.prisma.faithPathTemplate.findUnique({
      where: { objective: preferences.faithPathObjective },
      include: { steps: { orderBy: { order: 'asc' } } },
    });
    if (!template) throw new NotFoundException('Itinerario no encontrado');

    const [progress, completions] = await Promise.all([
      this.prisma.faithPathProgress.upsert({
        where: { userId_templateId: { userId, templateId: template.id } },
        create: { userId, templateId: template.id },
        update: {},
      }),
      this.prisma.faithPathStepCompletion.findMany({
        where: { userId, step: { templateId: template.id } },
        select: { stepId: true },
      }),
    ]);

    const completedStepIds = new Set(completions.map((c) => c.stepId));
    const steps: FaithPathStepSummary[] = template.steps.map((step) => ({
      id: step.id,
      order: step.order,
      title: step.title,
      description: step.description,
      videoId: step.videoId,
      prayerId: step.prayerId,
      bibleVerseId: step.bibleVerseId,
      saintId: step.saintId,
      completed: completedStepIds.has(step.id),
    }));

    const totalSteps = steps.length;
    const progressPercent = totalSteps > 0 ? Math.round((completedStepIds.size / totalSteps) * 100) : 0;

    return {
      id: template.id,
      objective: template.objective as FaithPathObjective,
      currentStepOrder: progress.currentStepOrder,
      totalSteps,
      progressPercent,
      steps,
    };
  }

  async getProgressSummary(userId: string) {
    const preferences = await this.prisma.userPreferences.findUnique({ where: { userId } });
    if (!preferences?.faithPathObjective) return null;
    const path = await this.getMyPath(userId);
    return {
      objective: path.objective,
      currentStepOrder: path.currentStepOrder,
      totalSteps: path.totalSteps,
      progressPercent: path.progressPercent,
    };
  }

  async completeStep(userId: string, stepId: string) {
    const step = await this.prisma.faithPathStep.findUnique({ where: { id: stepId } });
    if (!step) throw new NotFoundException('Paso no encontrado');

    await this.prisma.faithPathStepCompletion.upsert({
      where: { userId_stepId: { userId, stepId } },
      create: { userId, stepId },
      update: {},
    });

    const progress = await this.prisma.faithPathProgress.findUnique({
      where: { userId_templateId: { userId, templateId: step.templateId } },
    });
    if (progress && step.order >= progress.currentStepOrder) {
      const totalSteps = await this.prisma.faithPathStep.count({ where: { templateId: step.templateId } });
      const nextOrder = step.order + 1;
      await this.prisma.faithPathProgress.update({
        where: { id: progress.id },
        data: {
          currentStepOrder: Math.min(nextOrder, totalSteps),
          completedAt: nextOrder > totalSteps ? new Date() : null,
        },
      });
    }

    return { completed: true };
  }
}
