import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { EventRepository } from './event.repository';

@Module({
  providers: [EventService, EventRepository],
  controllers: [EventController],
})
export class EventModule {}
