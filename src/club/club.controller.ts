import { Body, Controller, Delete, HttpCode, Param, ParseIntPipe, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import { CurrentUser } from "src/auth/decorator/user.decorator";
import { UserBaseInfo } from "src/auth/type/user-base-info.type";
import { CreateClubPayload } from "./payload/create-club-payload";
import { ClubService } from "./club.service";
import { ClubDto } from "./dto/club.dto";

@Controller('clubs')
@ApiTags('club API')
export class ClubController {
  constructor(private readonly clubService: ClubService) {}

  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '클럽 생성' })
  @ApiCreatedResponse({ type: ClubDto })
  async createdClub(
    @Body() payload: CreateClubPayload,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<ClubDto> {
    return this.clubService.createClub(payload, user);
  }

}