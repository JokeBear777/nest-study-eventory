import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CreateEventData } from './type/create-event-data.type';
import { EventData } from './type/event-data';
import { Category, City, User, type Club } from '@prisma/client';
import { EventQuery } from './query/event.query';
import { UpdateEventData } from './type/update-event-data';


@Injectable()
export class EventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createEvent(data: CreateEventData): Promise<EventData> {
    return this.prisma.event.create({
      data: {
        hostId: data.hostId,
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        startTime: data.startTime,
        endTime: data.endTime,
        maxPeople: data.maxPeople,
        eventJoin: {
          create: {
            userId: data.hostId,
          },
        },
        eventCity: {
          create: data.cityIds.map((cityId) => ({
            cityId,
          })),
        },
      },
      select: {
        id: true,
        hostId: true,
        title: true,
        description: true,
        categoryId: true,
        clubId: true,
        startTime: true,
        endTime: true,
        maxPeople: true,
        isArchived: true,
        eventCity: {
          select: {
            id: true,
            cityId: true,
          },
        },
      },
    });
  }

  async getUserById(userId: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
        deletedAt: null,
      },
    });
  }

  async getCategoryById(categoryId: number): Promise<Category | null> {
    return this.prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });
  }

  async getCityById(cityId: number): Promise<City | null> {
    return this.prisma.city.findUnique({
      where: {
        id: cityId,
      },
    });
  }

  async getCitiesById(cityIds: number[]): Promise<City[]> {
    return this.prisma.city.findMany({
      where: {
        id: { in: cityIds },
      },
    });
  }

  async getEventById(eventId: number): Promise<EventData | null> {
    return this.prisma.event.findUnique({
      where: {
        id: eventId,
      },
      select: {
        id: true,
        hostId: true,
        title: true,
        description: true,
        categoryId: true,
        clubId: true,
        startTime: true,
        endTime: true,
        maxPeople: true,
        isArchived: true,
        eventCity: {
          select: {
            id: true,
            cityId: true,
          },
        },
      },
    });
  }

  async getEvents(query: EventQuery, userId: number): Promise<EventData[]> {
    return this.prisma.event.findMany({
      where: {
        host: {
          id: query.hostId,
          deletedAt: null,
        },
        eventCity: {
          some: {
              cityId: query.cityId,
          },
        },
        categoryId: query.categoryId,
        clubId: query.clubId,
      },
      select: {
        id: true,
        hostId: true,
        title: true,
        description: true,
        categoryId: true,
        clubId: true,
        startTime: true,
        endTime: true,
        maxPeople: true,
        isArchived: true,
        eventCity: {
          select: {
            id: true,
            cityId: true,
          },
        },
      },
    });
  }

  async joinEvent(eventId: number, userId: number): Promise<void> {
    this.prisma.eventJoin.create({
      data: {
        eventId: eventId,
        userId: userId,
      },
      select: {
        id: true,
        eventId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async isUserJoinedEvent(eventId: number, userId: number): Promise<boolean> {
    const event = await this.prisma.eventJoin.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
        user: {
          deletedAt: null,
        },
      },
    });

    return !!event;
  }

  async outEvent(eventId: number, userId: number): Promise<void> {
    await this.prisma.eventJoin.delete({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });
  }

  async getEventHeadCount(eventId: number): Promise<number> {
    return this.prisma.eventJoin.count({
      where: {
        eventId: eventId,
        user: {
          deletedAt: null,
        },
      },
    });
  }

  async updateEvent(
    eventId: number,
    data: UpdateEventData,
  ): Promise<EventData> {
    return this.prisma.event.update({
      where: {
        id: eventId,
      },
      data: {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        startTime: data.startTime,
        endTime: data.endTime,
        maxPeople: data.maxPeople,
        eventCity: {
          create: data.cityIds.map((cityId) => ({
            cityId,
          })),
        },
      },
      select: {
        id: true,
        hostId: true,
        title: true,
        description: true,
        categoryId: true,
        clubId: true,
        startTime: true,
        endTime: true,
        maxPeople: true,
        isArchived: true,
        eventCity: {
          select: {
            id: true,
            cityId: true,
          },
        },
      },
    });
  }

  async deleteEvent(eventId: number): Promise<void> {
    await this.prisma.eventJoin.deleteMany({
      where: {
        eventId: eventId,
      },
    });

    await this.prisma.event.delete({
      where: {
        id: eventId,
      },
    });
  }

  async getEventsJoined(userId: number): Promise<EventData[]> {
    return this.prisma.event.findMany({
      where: {
        eventJoin: {
          some: {
            userId,
          },
        },
      },
      select: {
        id: true,
        hostId: true,
        title: true,
        description: true,
        categoryId: true,
        clubId: true,
        startTime: true,
        endTime: true,
        maxPeople: true,
        isArchived: true,
        eventCity: {
          select: {
            id: true,
            cityId: true,
          },
        },
      },
    });
  }

  async getClubById(clubId: number): Promise<Club | null> {
    return this.prisma.club.findUnique({
      where: {
        id: clubId,
      },
    });
  }

  async isClubMember(clubId: number, userId: number): Promise<boolean> {
    const clubMember = await this.prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId: clubId,
          userId: userId,
        },
      },
    });
  
    return clubMember !== null; 
  }
}
