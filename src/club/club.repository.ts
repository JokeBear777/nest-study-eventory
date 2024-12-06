import { Injectable } from '@nestjs/common';
import { CreateClubData } from './type/create-club-data';
import { ClubData } from './type/club-data';
import { PrismaService } from 'src/common/services/prisma.service';
import { Status } from '@prisma/client';
import { UpdateClubData } from './type/update-club-data';

@Injectable()
export class ClubRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createClub(data: CreateClubData): Promise<ClubData> {
    return this.prisma.club.create({
      data: {
        hostId: data.hostId,
        name: data.name,
        description: data.description,
        maxPeople: data.maxPeople,
        clubMember: {
          create: {
            userId: data.hostId,
            status: Status.LEADER,
          },
        },
      },
      select: {
        id: true,
        hostId: true,
        name: true,
        description: true,
        maxPeople: true,
      },
    });
  }

  async getClubById(clubId: number): Promise<ClubData | null> {
    return this.prisma.club.findUnique({
      where: {
        id: clubId,
      },
    });
  }

  async getClubHeadCount(clubId: number): Promise<number> {
    return this.prisma.clubMember.count({
      where: {
        clubId: clubId,
        user: {
          deletedAt: null,
        },
        status: {
          not: Status.PENDING,
        },
      },
    });
  }

  async updateClub(clubId: number, data: UpdateClubData): Promise<ClubData> {
    return this.prisma.club.update({
      where: {
        id: clubId,
      },
      data: {
        name: data.name,
        description: data.description,
        maxPeople: data.maxPeople,
      },
      select: {
        id: true,
        hostId: true,
        name: true,
        description: true,
        maxPeople: true,
      },
    });
  }

  async deleteClub(clubId: number, date: Date): Promise<void> {
    await this.prisma.$transaction(async (prisma) => {
      await prisma.event.deleteMany({
        where: {
          clubId: clubId,
          OR: [{ startTime: { gte: date } }, { endTime: { lte: date } }],
        },
      });

      await prisma.event.updateMany({
        where: {
          clubId: clubId,
          AND: [{ startTime: { lt: date } }, { endTime: { gt: date } }],
        },
        data: {
          clubId: null,
          isArchived: true,
        },
      });

      await prisma.clubMember.deleteMany({
        where: {
          clubId: clubId,
        },
      });

      await prisma.club.delete({
        where: {
          id: clubId,
        },
      });
    });
  }

  async getClubList(): Promise<ClubData[]> {
    return this.prisma.club.findMany({
      select: {
        id: true,
        hostId: true,
        name: true,
        description: true,
        maxPeople: true,
      },
    });
  }

  async getClubMemberStatus(
    clubId: number,
    userId: number,
  ): Promise<Status | null> {
    const result = await this.prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
      select: {
        status: true,
      },
    });

    return result?.status ?? null;
  }

  async joinClub(clubId: number, userId: number): Promise<void> {
    this.prisma.clubMember.create({
      data: {
        clubId: clubId,
        userId: userId,
      },
      select: {
        id: true,
        clubId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async outClub(clubId: number, userId: number, date: Date): Promise<void> {
    await this.prisma.$transaction(async (prisma) => {
      await prisma.eventJoin.deleteMany({
        where: {
          event: {
            clubId: clubId,
            startTime: { gt: date },
          },
          userId: userId,
        },
      });

      await this.prisma.eventJoin.deleteMany({
        where: {
          event: {
            clubId: clubId,
            hostId: userId,
            startTime: { gt: date },
          },
        },
      });

      await prisma.event.deleteMany({
        where: {
          clubId: clubId,
          hostId: userId,
          startTime: { gt: date },
        },
      });

      await prisma.clubMember.delete({
        where: {
          clubId_userId: {
            clubId,
            userId,
          },
        },
      });
    });
  }

  async hasInvalidUsers(clubId: number, userIds: number[]): Promise<boolean> {
    const InvalidUser = await this.prisma.clubMember.findFirst({
      where: {
        clubId: clubId,
        userId: { in: userIds },
        OR: [
          { status: { not: Status.PENDING } },
          {
            user: {
              deletedAt: { not: null },
            },
          },
        ],
      },
    });

    return !!InvalidUser;
  }

  async approveApplicants(clubId: number, userIds: number[]): Promise<void> {
    await this.prisma.clubMember.updateMany({
      where: {
        clubId: clubId,
        userId: { in: userIds },
      },
      data: {
        status: Status.APPROVED,
      },
    });
  }
}
