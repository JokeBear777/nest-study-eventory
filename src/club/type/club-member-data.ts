import type { Status } from '@prisma/client';

export type ClubMemberData = {
  id: number;
  clubId: number;
  userId: number;
  status: Status;
};
