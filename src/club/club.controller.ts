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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorator/user.decorator';
import { UserBaseInfo } from 'src/auth/type/user-base-info.type';
import { CreateClubPayload } from './payload/create-club-payload';
import { ClubService } from './club.service';
import { ClubDto, ClubListDto } from './dto/club.dto';
import { PutUpdateClubPayload } from './payload/put-update-club-payload';
import { ApproveApplicantsPayload } from './payload/approve-applicants.payload';
import { RejectApplicantsPayload } from './payload/reject-applicants-payload';

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

  @Put(':clubId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '클럽을 수정합니다' })
  @ApiOkResponse({ type: ClubDto })
  async putUpdateClub(
    @Param('clubId', ParseIntPipe) clubId: number,
    @Body() payload: PutUpdateClubPayload,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<ClubDto> {
    return this.clubService.putUpdateClub(clubId, payload, user);
  }

  @Delete(':clubId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: '클럽을 삭제합니다' })
  @ApiNoContentResponse()
  async deleteClub(
    @Param('clubId', ParseIntPipe) clubId: number,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<void> {
    return this.clubService.deleteClub(clubId, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: '클럽 목록을 조회합니다' })
  @ApiOkResponse({ type: ClubListDto })
  async getClubList(): Promise<ClubListDto> {
    return this.clubService.getClubList();
  }

  @Post(':clubId/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: '유저가 클럽에 가입 신청합니다' })
  @ApiNoContentResponse()
  async joinClub(
    @Param('clubId', ParseIntPipe) clubId: number,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<void> {
    return this.clubService.joinClub(clubId, user);
  }

  @Post(':clubId/out')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: '유저가 클럽에서 탈퇴합니다' })
  @ApiNoContentResponse()
  async outClub(
    @Param('clubId', ParseIntPipe) clubId: number,
    @CurrentUser() user: UserBaseInfo,
  ): Promise<void> {
    return this.clubService.outClub(clubId, user);
  }

  @Post(':clubId/applicants/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: '특정 유저의 클럽 가입 신청을 승인합니다' })
  @ApiNoContentResponse()
  async approveApplicants(
    @Param('clubId', ParseIntPipe) clubId: number,
    @CurrentUser() user: UserBaseInfo,
    @Body() payload: ApproveApplicantsPayload,
  ): Promise<void> {
    return this.clubService.approveApplicants(clubId, user, payload);
  }

  @Post(':clubId/applicants/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: '특정 유저의 클럽 가입 신청을 거절합니다' })
  @ApiNoContentResponse()
  async rejectApplicants(
    @Param('clubId', ParseIntPipe) clubId: number,
    @CurrentUser() user: UserBaseInfo,
    @Body() payload: RejectApplicantsPayload,
  ): Promise<void> {
    return this.clubService.rejectApplicants(clubId, user, payload);
  }
}
