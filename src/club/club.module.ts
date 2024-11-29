import { Module } from "@nestjs/common";
import { ClubRepository } from "./club.repository";
import { ClubService } from "./club.service";
import { ClubController } from "./club.controller";


@Module({
    providers: [ClubService, ClubRepository],
    controllers: [ClubController],
  })
  export class clubModule {}
  