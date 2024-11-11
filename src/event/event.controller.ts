import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { EventService } from './event.service';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { EventDto, EventListDto } from './dto/event.dto';
import { CreateEventPayload } from './payload/create-event-payload';
import { EventQuery } from './query/event.query';
import { UpdateEventJoinPayload } from './payload/update-event-join-payload';
import type { PutUpdateEventPayload } from './payload/put-update-event-payload';

@Controller('events')
@ApiTags('Event API')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: '모임 생성' })
  @ApiCreatedResponse({ type: EventDto })
  async createdEvent(@Body() payload: CreateEventPayload): Promise<EventDto> {
    return this.eventService.createEvent(payload);
  }

  @Get(':eventId')
  @HttpCode(200)
  @ApiOperation({ summary: '특정 id의 모임 데이터를 가져옵니다.' })
  @ApiOkResponse({ type: EventDto })
  async getEventById(
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<EventDto> {
    return this.eventService.getEventById(eventId);
  }

  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: '특정 id의 모임 데이터를 가져옵니다.' })
  @ApiOkResponse({ type: EventListDto })
  async getEvents(@Query() query: EventQuery): Promise<EventListDto> {
    return this.eventService.getEvents(query);
  }

  @Post(':eventId/join')
  @HttpCode(204)
  @ApiOperation({ summary: '유저를 event에 참여시킵니다' })
  @ApiNoContentResponse()
  async joinEvent(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() payload: UpdateEventJoinPayload,
  ): Promise<void> {
    this.eventService.joinEvent(eventId, payload);
  }

  @Post(':eventId/out')
  @HttpCode(204)
  @ApiOperation({ summary: '유저를 event에서 내보냅니다' })
  @ApiNoContentResponse()
  async outEvent(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() payload: UpdateEventJoinPayload,
  ): Promise<void> {
    this.eventService.outEvent(eventId, payload);
  }

  @Put(':eventId')
  @ApiOperation({ summary: '모임을 수정합니다' })
  @ApiOkResponse({ type: EventDto })
  async putUpdateEvent(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() payload: PutUpdateEventPayload,
  ): Promise<EventDto> {
    return this.eventService.putUpdateEvent(eventId, payload);
  }

  @Delete(':eventId')
  @HttpCode(204)
  @ApiOperation({ summary: '이벤트를 삭제합니다' })
  @ApiNoContentResponse()
  async deleteEvent(
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<void> {
    return this.eventService.deleteEvent(eventId);
  }
}
