import { Injectable } from '@nestjs/common';
import { CreateClubData } from './type/create-club-data';
import { ClubData } from './type/club-data';
import { PrismaService } from 'src/common/services/prisma.service';
import { UpdateClubData } from './type/update-club-data';
import { Status } from '@prisma/client';

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
}
