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
  UseGuards,
} from '@nestjs/common';
import { EventService } from './event.service';
import {
  ApiBearerAuth,
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
import { PutUpdateEventPayload } from './payload/put-update-event-payload';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorator/user.decorator';
import { UserBaseInfo } from 'src/auth/type/user-base-info.type';

@Controller('events')
@ApiTags('Event API')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '모임 생성' })
  @ApiCreatedResponse({ type: EventDto })
  async createdEvent(
    @Body() payload: CreateEventPayload,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<EventDto> {
    return this.eventService.createEvent(payload, user);
  }

  @Get(':eventId')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '특정 id의 모임 데이터를 가져옵니다.' })
  @ApiOkResponse({ type: EventDto })
  async getEventById(
    @Param('eventId', ParseIntPipe) eventId: number,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<EventDto> {
    return this.eventService.getEventById(eventId, user);
  }

  @Get()
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '특정 모임 데이터를 가져옵니다.' })
  @ApiOkResponse({ type: EventListDto })
  async getEvents(
    @Query() query: EventQuery,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<EventListDto> {
    return this.eventService.getEvents(query, user);
  }

  @Post(':eventId/join')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '유저를 event에 참여시킵니다' })
  @ApiNoContentResponse()
  async joinEvent(
    @Param('eventId', ParseIntPipe) eventId: number,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<void> {
    this.eventService.joinEvent(eventId, user);
  }

  @Post(':eventId/out')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '유저를 event에서 내보냅니다' })
  @ApiNoContentResponse()
  async outEvent(
    @Param('eventId', ParseIntPipe) eventId: number,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<void> {
    this.eventService.outEvent(eventId, user);
  }

  @Put(':eventId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '모임을 수정합니다' })
  @ApiOkResponse({ type: EventDto })
  async putUpdateEvent(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() payload: PutUpdateEventPayload,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<EventDto> {
    return this.eventService.putUpdateEvent(eventId, payload, user);
  }

  @Delete(':eventId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: '이벤트를 삭제합니다' })
  @ApiNoContentResponse()
  async deleteEvent(
    @Param('eventId', ParseIntPipe) eventId: number,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<void> {
    return this.eventService.deleteEvent(eventId, user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내가 참여한 모임 조회' })
  @ApiOkResponse({ type: EventListDto })
  async getMyEvents(@CurrentUser() user: UserBaseInfo): Promise<EventListDto> {
    return this.eventService.getMyEvents(user);
  }
}
