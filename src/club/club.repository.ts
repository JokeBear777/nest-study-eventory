import { Injectable } from '@nestjs/common';
import { CreateClubData } from './type/create-club-data';
import { ClubData } from './type/club-data';
import { PrismaService } from 'src/common/services/prisma.service';
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
}
