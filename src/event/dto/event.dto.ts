import { ApiProperty } from '@nestjs/swagger';
import type { EventData } from '../type/event-data';

export class EventDto {
  @ApiProperty({
    description: '모임 ID',
    type: Number,
  })
  id!: number;

  @ApiProperty({
    description: '호스트 ID',
    type: Number,
  })
  hostId!: number;

  @ApiProperty({
    description: '제목',
    type: String,
  })
  title!: string;

  @ApiProperty({
    description: '내용',
    type: String,
  })
  description!: string;

  @ApiProperty({
    description: '카테고리',
    type: Number,
  })
  categoryId!: number;

  @ApiProperty({
    description: '지역',
    type: Number,
  })
  cityId!: number;

  @ApiProperty({
    description: '시작 시각',
    type: Date,
  })
  startTime!: Date;

  @ApiProperty({
    description: '종료 시각',
    type: Date,
  })
  endTime!: Date;

  @ApiProperty({
    description: '최대 정원',
    type: Number,
  })
  maxPeople!: number;

  static from(event: EventData): EventDto {
    return {
      id: event.id,
      hostId: event.hostId,
      title: event.title,
      description: event.description,
      categoryId: event.categoryId,
      cityId: event.cityId,
      startTime: event.startTime,
      endTime: event.endTime,
      maxPeople: event.maxPeople,
    };
  }

  static fromArray(events: EventData[]): EventDto[] {
    return events.map((event) => this.from(event));
  }
}

export class EventListDto {
  @ApiProperty({
    description: '이벤트 목록',
    type: [EventDto],
  })
  events!: EventDto[];

  static from(events: EventData[]): EventListDto {
    return {
      events: EventDto.fromArray(events),
    };
  }
}