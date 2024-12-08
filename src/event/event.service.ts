import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventRepository } from './event.repository';
import { CreateEventPayload } from './payload/create-event-payload';
import { EventDto, EventListDto } from './dto/event.dto';
import { CreateEventData } from './type/create-event-data.type';
import { EventQuery } from './query/event.query';
import { UpdateEventJoinPayload } from './payload/update-event-join-payload';
import { PutUpdateEventPayload } from './payload/put-update-event-payload';
import { UpdateEventData } from './type/update-event-data';
import { UserBaseInfo } from 'src/auth/type/user-base-info.type';
import { EventData } from './type/event-data';

@Injectable()
export class EventService {
  constructor(private readonly eventRepository: EventRepository) {}

  async createEvent(
    payload: CreateEventPayload,
    user: UserBaseInfo,
  ): Promise<EventDto> {
    const category = await this.eventRepository.getCategoryById(
      payload.categoryId,
    );
    if (!category) {
      throw new NotFoundException('카테고리가 존재하지 않습니다.');
    }

    const cities = await this.eventRepository.getCitiesById(payload.cityIds);
    if (cities.length != payload.cityIds.length) {
      throw new NotFoundException('일부 지역이 존재하지 않습니다.');
    }

    if (payload.clubId != null) {
      const club = await this.eventRepository.getClubById(payload.clubId);
      if (!club) {
        throw new NotFoundException('클럽이 존재하지 않습니다.');
      }

      const isClubMember = await this.eventRepository.isClubMember(payload.clubId, user.id);
      if (!isClubMember) {
        throw new ForbiddenException('해당 클럽멤버만 클럽 모임을 생성할 수 있습니다');
      }
    }

    const now = new Date();

    if (payload.startTime < now || payload.endTime < now) {
      throw new ConflictException(
        '시작 시간 또는 종료 시간은 현재 시간보다 빠를 수 없습니다.',
      );
    }

    if (payload.startTime > payload.endTime) {
      throw new ConflictException('시작 시간은 종료시간보다 느릴 수 없습니다.');
    }

    const createData: CreateEventData = {
      hostId: user.id,
      title: payload.title,
      description: payload.description,
      categoryId: payload.categoryId,
      cityIds: payload.cityIds,
      clubId: payload.clubId ?? null,
      startTime: payload.startTime,
      endTime: payload.endTime,
      maxPeople: payload.maxPeople,
    };

    const event = await this.eventRepository.createEvent(createData);

    return EventDto.from(event);
  }

  async getEventById(eventId: number, user: UserBaseInfo): Promise<EventDto> {
    const event = await this.eventRepository.getEventById(eventId);

    if (!event) {
      throw new NotFoundException('event가 존재하지 않습니다.');
    }

    if (event.clubId != null) {
      const isUserClubMember = await this.eventRepository.isClubMember(event.clubId, user.id);
      if (!isUserClubMember) {
        throw new ForbiddenException('클럽모임은 클럽원만 조회할 수 있습니다 ');
      }
    }

    if (event.isArchived === true) {
      const isUserJoinedEvent = await this.eventRepository.isUserJoinedEvent(eventId, user.id);
      throw new ForbiddenException('삭제된 클럽의 클럽모임은 참여자만 조회할 수 있습니다 ');
    }

    return EventDto.from(event);
  }

  async getEvents(query: EventQuery, user: UserBaseInfo): Promise<EventListDto> {
    
    if (query.clubId) {
      const isUserClubMember = await this.eventRepository.isClubMember(query.clubId, user.id);
      if (!isUserClubMember) {
        throw new ForbiddenException('클럽모임은 클럽원만 조회할 수 있습니다 ');
      }
    }
 
    const events = await this.eventRepository.getEvents(query, user.id);

    const eventIds = events.map((event) => event.id);

    const joinedEventIds = await this.eventRepository.getUserJoinedEvents(eventIds, user.id);

    const filteredEvents = events.filter((event) => {
      if (!event.isArchived) {
        return true; 
      }
      return joinedEventIds.has(event.id); 
    });
  
    return EventListDto.from(filteredEvents);
  }

  async joinEvent(eventId: number, user: UserBaseInfo): Promise<void> {
    const event = await this.eventRepository.getEventById(eventId);
    if (!event) {
      throw new NotFoundException('이벤트가 존재하지 않습니다.');
    }

    const isEventJoin = await this.eventRepository.isUserJoinedEvent(
      eventId,
      user.id,
    );
    if (isEventJoin) {
      throw new ConflictException('이미 참가한 모임입니다.');
    }

    if (event.clubId !== null) {
      const club = await this.eventRepository.getClubById(event.clubId);
      if (!club) {
        throw new NotFoundException('클럽이 존재하지 않습니다.');
      }

      const isClubMember = await this.eventRepository.isClubMember(event.clubId, user.id);
      if (!isClubMember) {
        throw new ForbiddenException('해당 클럽멤버만 클럽 모임에 참가할 수 있습니다');
      }
    }

    if (event.startTime < new Date()) {
      throw new ConflictException('모임 시작 전까지만 참가가 가능합니다');
    }

    const eventHeadCount =
      await this.eventRepository.getEventHeadCount(eventId);
    if (event.maxPeople === eventHeadCount) {
      throw new ConflictException('모임 인원이 가득차 참가할 수 없습니다');
    }

    await this.eventRepository.joinEvent(eventId, user.id);
  }

  async outEvent(eventId: number, user: UserBaseInfo): Promise<void> {
    const event = await this.eventRepository.getEventById(eventId);
    if (!event) {
      throw new NotFoundException('이벤트가 존재하지 않습니다.');
    }

    const eventJoin = await this.eventRepository.isUserJoinedEvent(
      eventId,
      user.id,
    );
    if (!eventJoin) {
      throw new ConflictException('참가하지 않은 모임은 탈퇴할 수 없습니다');
    }

    if (event.startTime < new Date()) {
      throw new ConflictException('모임 시작 전까지만 탈퇴가 가능합니다');
    }

    if (event.endTime < new Date()) {
      throw new ConflictException('이미 종료된 모임에는 탈퇴 할 수 없습니다.');
    }

    const eventHeadCount =
      await this.eventRepository.getEventHeadCount(eventId);
    if (1 === eventHeadCount) {
      throw new ConflictException('모임 인원은 최소 1명 이상이여야 합니다');
    }

    await this.eventRepository.outEvent(eventId, user.id);
  }

  async putUpdateEvent(
    eventId: number,
    payload: PutUpdateEventPayload,
    user: UserBaseInfo,
  ): Promise<EventDto> {
    const event = await this.eventRepository.getEventById(eventId);

    if (!event) {
      throw new NotFoundException('Event가 존재하지 않습니다.');
    }

    if (event.hostId !== user.id) {
      throw new ForbiddenException('모임 주최자만 수정할 수 있습니다');
    }

    const category = await this.eventRepository.getCategoryById(
      payload.categoryId,
    );
    if (!category) {
      throw new NotFoundException('카테고리가 존재하지 않습니다.');
    }

    const cities = await this.eventRepository.getCitiesById(payload.cityIds);
    if (cities.length != payload.cityIds.length) {
      throw new NotFoundException('일부 지역이 존재하지 않습니다.');
    }

    const now = new Date();

    if (event.startTime < now) {
      throw new ConflictException('모임 시작 전까지만 수정이 가능합니다');
    }

    if (payload.startTime < now || payload.endTime < now) {
      throw new ConflictException(
        '시작 시간 또는 종료 시간은 현재 시간보다 빠를 수 없습니다.',
      );
    }

    if (payload.startTime > payload.endTime) {
      throw new ConflictException('시작 시간은 종료시간보다 느릴 수 없습니다.');
    }

    const eventHeadCount =
      await this.eventRepository.getEventHeadCount(eventId);

    if (payload.maxPeople < eventHeadCount) {
      throw new ConflictException('최대 인원은 현재 인원보다 적을 수 없습니다');
    }

    const updateData: UpdateEventData = {
      title: payload.title,
      description: payload.description,
      categoryId: payload.categoryId,
      cityIds: payload.cityIds,
      startTime: payload.startTime,
      endTime: payload.endTime,
      maxPeople: payload.maxPeople,
    };

    const updatedEvent = await this.eventRepository.updateEvent(
      eventId,
      updateData,
    );

    return EventDto.from(updatedEvent);
  }

  async deleteEvent(eventId: number, user: UserBaseInfo): Promise<void> {
    const event = await this.eventRepository.getEventById(eventId);

    if (!event) {
      throw new NotFoundException('event가 존재하지 않습니다.');
    }

    if (event.hostId !== user.id) {
      throw new ForbiddenException('모임 주최자만 수정할 수 있습니다');
    }

    if (event.startTime < new Date()) {
      throw new ConflictException('모임 시작 전까지만 삭제 가능합니다');
    }

    await this.eventRepository.deleteEvent(eventId);
  }

  async getMyEvents(user: UserBaseInfo): Promise<EventListDto> {
    const events = await this.eventRepository.getEventsJoined(user.id);

    return EventListDto.from(events);
  }
}
