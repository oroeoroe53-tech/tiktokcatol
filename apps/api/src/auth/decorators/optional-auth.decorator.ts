import { applyDecorators, UseGuards } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../guards/optional-jwt-auth.guard';

export const OptionalAuth = () => applyDecorators(Public(), UseGuards(OptionalJwtAuthGuard));
