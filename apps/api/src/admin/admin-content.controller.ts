import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { ContentCategory, UserRole } from '@faro/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { AdminContentService } from './admin-content.service';

const updateCategorySchema = z.object({
  labelEs: z.string().min(1).optional(),
  labelEn: z.string().min(1).optional(),
  icon: z.string().optional(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
});
type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

const createChallengeSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(500),
  imageUrl: z.string().url().optional(),
  category: z.nativeEnum(ContentCategory),
  durationDays: z.number().int().positive().max(90),
  days: z
    .array(
      z.object({
        dayNumber: z.number().int().positive(),
        title: z.string().min(1),
        description: z.string().min(1).max(500),
        videoId: z.string().optional(),
        prayerId: z.string().optional(),
      }),
    )
    .min(1),
});
type CreateChallengeInput = z.infer<typeof createChallengeSchema>;

const broadcastSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(300),
  audience: z.enum(['ALL', 'ACTIVE_7D']).default('ACTIVE_7D'),
});
type BroadcastInput = z.infer<typeof broadcastSchema>;

@ApiTags('admin-content')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.EDITOR)
@Controller('admin/content')
export class AdminContentController {
  constructor(private readonly adminContentService: AdminContentService) {}

  @Get('categories')
  listCategories() {
    return this.adminContentService.listCategories();
  }

  @Patch('categories/:key')
  updateCategory(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('key') key: string,
    @Body(new ZodValidationPipe(updateCategorySchema)) input: UpdateCategoryInput,
  ) {
    return this.adminContentService.updateCategory(admin.id, key, input);
  }

  @Post('challenges')
  createChallenge(
    @CurrentUser() admin: AuthenticatedUser,
    @Body(new ZodValidationPipe(createChallengeSchema)) input: CreateChallengeInput,
  ) {
    return this.adminContentService.createChallenge(admin.id, input);
  }

  @Patch('challenges/:id/active')
  setChallengeActive(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(z.object({ active: z.boolean() }))) input: { active: boolean },
  ) {
    return this.adminContentService.setChallengeActive(admin.id, id, input.active);
  }

  @Post('notifications/broadcast')
  broadcast(
    @CurrentUser() admin: AuthenticatedUser,
    @Body(new ZodValidationPipe(broadcastSchema)) input: BroadcastInput,
  ) {
    return this.adminContentService.broadcastNotification(admin.id, input);
  }
}
