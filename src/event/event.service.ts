import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventRepository } from './event.repository';
import { CreateEventPayload } from './payload/create-event-payload';
import { EventDto, EventListDto } from './dto/event.dto';
import { CreateEventData } from './type/create-event-data.type';
import { EventQuery } from './query/event.query';
import { UpdateEventJoinPayload } from './payload/update-event-join-payload';
import type { PutUpdateEventPayload } from './payload/put-update-event-payload';
import type { UpdateEventData } from './type/update-event-data';

//서비스 바꿔주고 지역들이 존재하지 않는다고 map써서 다 검사하자
@Injectable()
export class EventService {
  constructor(private readonly eventRepository: EventRepository) {}

  async createEvent(payload: CreateEventPayload): Promise<EventDto> {
    const host = await this.eventRepository.getUserById(payload.hostId);
    if (!host) {
      throw new NotFoundException('호스트가 존재하지 않습니다.');
    }

    const category = await this.eventRepository.getCategoryById(
      payload.categoryId,
    );
    if (!category) {
      throw new NotFoundException('카테고리가 존재하지 않습니다.');
    }

    for (const cityId of payload.cityIds) {
      const city = await this.eventRepository.getCityById(cityId);
      if (!city) {
        throw new NotFoundException('지역이 존재하지 않습니다.');
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
      hostId: payload.hostId,
      title: payload.title,
      description: payload.description,
      categoryId: payload.categoryId,
      cityIds: payload.cityIds,
      startTime: payload.startTime,
      endTime: payload.endTime,
      maxPeople: payload.maxPeople,
    };

    const event = await this.eventRepository.createEvent(createData);

    return EventDto.from(event);
  }

  async getEventById(eventId: number): Promise<EventDto> {
    const event = await this.eventRepository.getEventById(eventId);

    if (!event) {
      throw new NotFoundException('event가 존재하지 않습니다.');
    }

    return EventDto.from(event);
  }

  async getEvents(query: EventQuery): Promise<EventListDto> {
    const events = await this.eventRepository.getEvents(query);
    return EventListDto.from(events);
  }

  async joinEvent(
    eventId: number,
    payload: UpdateEventJoinPayload,
  ): Promise<void> {
    const user = await this.eventRepository.getUserById(payload.userId);
    if (!user) {
      throw new NotFoundException('유저가 존재하지 않습니다.');
    }

    const event = await this.eventRepository.getEventById(eventId);
    if (!event) {
      throw new NotFoundException('이벤트가 존재하지 않습니다.');
    }

    const isEventJoin = await this.eventRepository.isUserJoinedEvent(
      eventId,
      payload.userId,
    );
    if (isEventJoin) {
      throw new ConflictException('이미 참가한 모임입니다.');
    }

    if (event.startTime < new Date()) {
      throw new ConflictException('모임 시작 전까지만 참가가 가능합니다');
    }

    const eventHeadCount =
      await this.eventRepository.getEventHeadCount(eventId);
    if (event.maxPeople === eventHeadCount) {
      throw new ConflictException('모임 인원이 가득차 참가할 수 없습니다');
    }

    await this.eventRepository.joinEvent(eventId, payload);
  }

  async outEvent(
    eventId: number,
    payload: UpdateEventJoinPayload,
  ): Promise<void> {
    const user = await this.eventRepository.getUserById(payload.userId);
    if (user) {
      throw new NotFoundException('유저가 존재하지 않습니다.');
    }

    const event = await this.eventRepository.getEventById(eventId);
    if (!event) {
      throw new NotFoundException('이벤트가 존재하지 않습니다.');
    }

    const eventJoin = await this.eventRepository.isUserJoinedEvent(
      eventId,
      payload.userId,
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

    await this.eventRepository.outEvent(eventId, payload.userId);
  }

  async putUpdateEvent(
    eventId: number,
    payload: PutUpdateEventPayload,
  ): Promise<EventDto> {
    const event = await this.eventRepository.getEventById(eventId);

    if (!event) {
      throw new NotFoundException('Event가 존재하지 않습니다.');
    }

    const category = await this.eventRepository.getCategoryById(
      payload.categoryId,
    );
    if (!category) {
      throw new NotFoundException('카테고리가 존재하지 않습니다.');
    }

    for (const cityId of payload.cityIds) {
      const city = await this.eventRepository.getCityById(cityId);
      if (!city) {
        throw new NotFoundException('지역이 존재하지 않습니다.');
      }
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

  async deleteEvent(eventId: number): Promise<void> {
    const event = await this.eventRepository.getEventById(eventId);

    if (!event) {
      throw new NotFoundException('event가 존재하지 않습니다.');
    }

    if (event.startTime < new Date()) {
      throw new ConflictException('모임 시작 전까지만 삭제 가능합니다');
    }

    await this.eventRepository.deleteEvent(eventId);
  }
}
