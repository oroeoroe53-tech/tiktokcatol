import type { User } from '@prisma/client';
import { UserRole, type UserProfile, type UserSummary } from '@faro/types';

const VERIFIED_ROLES: UserRole[] = [UserRole.PRIEST_VERIFIED, UserRole.ORG_VERIFIED];

export function toUserSummary(user: User): UserSummary {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    role: user.role as UserRole,
    verified: VERIFIED_ROLES.includes(user.role as UserRole),
  };
}

export function toUserProfile(
  user: User,
  counts: { followerCount: number; followingCount: number; videoCount: number },
): UserProfile {
  return {
    ...toUserSummary(user),
    email: user.email,
    bio: user.bio,
    status: user.status as UserProfile['status'],
    followerCount: counts.followerCount,
    followingCount: counts.followingCount,
    videoCount: counts.videoCount,
    createdAt: user.createdAt.toISOString(),
  };
}
