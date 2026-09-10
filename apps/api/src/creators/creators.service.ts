import { ConflictException, Injectable } from '@nestjs/common';
import { VerificationStatus } from '@faro/types';
import type { CreateVerificationRequestInput } from '@faro/validation';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CreatorsService {
  constructor(private readonly prisma: PrismaService) {}

  async submitVerificationRequest(userId: string, input: CreateVerificationRequestInput) {
    const pending = await this.prisma.creatorVerification.findFirst({
      where: { userId, status: { in: [VerificationStatus.PENDING, VerificationStatus.IN_REVIEW] } },
    });
    if (pending) {
      throw new ConflictException('Ya tienes una solicitud de verificación en curso');
    }
    return this.prisma.creatorVerification.create({
      data: {
        userId,
        type: input.type,
        legalName: input.legalName,
        organization: input.organization,
        documentUrl: input.documentUrl,
        notes: input.notes,
      },
    });
  }

  async myRequests(userId: string) {
    return this.prisma.creatorVerification.findMany({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
    });
  }
}
