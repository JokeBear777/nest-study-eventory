import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { CreateClubData } from './type/create-club-data';
import { ClubData } from './type/club-data';
import { ClubMemberStatus } from './type/club-member-status';
import { UpdateClubData } from './type/update-club-data';
import { ApproveApplicantsData } from './type/approve-applicants-data';
import { RejectApplicantsData } from './type/reject-applicants-data';
import { ClubMemberData } from './type/club-member-data';

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
            status: 'LEADER' as ClubMemberStatus,
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

  async getClubHeadCount(clubId: number): Promise<number> {
    return this.prisma.clubMember.count({
      where: {
        clubId: clubId,
        user: {
          deletedAt: null,
        },
        status: {
          not: 'PENDING',
        },
      },
    });
  }

  async getHostIdByClubId(clubId: number): Promise<number | null> {
    const result = await this.prisma.club.findUnique({
      where: {
        id: clubId,
      },
      select: {
        hostId: true,
      },
    });

    return result?.hostId ?? null;
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

  async getClubById(clubId: number): Promise<ClubData | null> {
    return this.prisma.club.findUnique({
      where: {
        id: clubId,
      },
    });
  }

  async deleteClub(clubId: number): Promise<void> {
    await this.prisma.clubMember.deleteMany({
      where: {
        clubId: clubId,
      },
    });

    await this.prisma.club.delete({
      where: {
        id: clubId,
      },
    });
  }

  async getClubMemberStatus(
    clubId: number,
    userId: number,
  ): Promise<ClubMemberStatus | null> {
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

    return result?.status as ClubMemberStatus | null;
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

  async countClubPendingMembersById(
    clubId: number,
    userIds: number[],
  ): Promise<number> {
    return this.prisma.clubMember.count({
      where: {
        clubId: clubId,
        userId: { in: userIds },
        status: 'PENDING',
      },
    });
  }

  async approveApplicants(
    clubId: number,
    data: ApproveApplicantsData,
  ): Promise<void> {
    await this.prisma.clubMember.updateMany({
      where: {
        clubId: clubId,
        userId: { in: data.userIds },
      },
      data: {
        status: 'APPROVED',
      },
    });
  }

  async rejectApplicants(
    clubId: number,
    data: RejectApplicantsData,
  ): Promise<void> {
    await this.prisma.clubMember.deleteMany({
      where: {
        clubId: clubId,
        userId: { in: data.userIds },
      },
    });
  }

  async getClubApplicants(clubId: number): Promise<ClubMemberData[]> {
    return await this.prisma.clubMember.findMany({
      where: {
        clubId: clubId,
        status: 'APPROVED',
      },
      select: {
        id: true,
        clubId: true,
        userId: true,
        status: true,
      },
    });
  }

  async updateClubHost(
    clubId: number,
    hostId: number,
    nextHostId: number,
  ): Promise<any> {
    const updatedClub = await this.prisma.club.update({
      where: { id: clubId },
      data: {
        hostId: nextHostId,
      },
    });

    await this.prisma.clubMember.updateMany({
      where: {
        clubId: clubId,
        userId: hostId,
      },
      data: {
        status: 'APPROVED' as ClubMemberStatus,
      },
    });

    await this.prisma.clubMember.updateMany({
      where: {
        clubId: clubId,
        userId: nextHostId,
      },
      data: {
        status: 'LEADER' as ClubMemberStatus,
      },
    });

    return updatedClub;
  }

  async outClub(clubId: number, userId: number): Promise<void> {
    await this.prisma.clubMember.delete({
      where: {
        clubId_userId: {
          clubId: clubId,
          userId: userId,
        },
      },
    });
  }
}
