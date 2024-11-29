import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "src/auth/decorator/user.decorator";
import { JwtAuthGuard } from "src/auth/guard/jwt-auth.guard";
import type { ClubService } from "./club.service";
import { ClubDto } from "./dto/ClubDto";
import type { UserBaseInfo } from "src/auth/type/user-base-info.type";
import type { CreateClubPayload } from "./payload/create-club-payload";
import type { PutUpdateClubPayload } from "./payload/put-update-club-payload";
import type { RejectApplicantsPayload } from "./payload/reject-applicants-payload";
import type { ApproveApplicantsPayload } from "./payload/approve-applicants-payload";
import { ClubMemberListDto } from "./dto/ClubMemberDto";
import type { UpdateClubHostPayload } from "./payload/update-club-host-payload";

@Controller('clubs')
@ApiTags('club API')
export class ClubController{

    constructor(private readonly clubService: ClubService) {}

    @Post()
    @HttpCode(201)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: '클럽 생성' })
    @ApiCreatedResponse({ type: ClubDto })
    async createdClub(
        @Body() payload: CreateClubPayload,
        @CurrentUser() user : UserBaseInfo, 
    ) : Promise<ClubDto>{
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
        @CurrentUser() user : UserBaseInfo, 
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

    @Post(':clubId/join')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(204)
    @ApiOperation({ summary: '유저가 클럽에 신청합니다' })
    @ApiNoContentResponse()
    async joinClub(
        @Param('clubId', ParseIntPipe) clubId: number,
        @CurrentUser() user: UserBaseInfo,
    ) :Promise<void> {
        return this.clubService.joinClub(clubId, user);
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
    ) :Promise<void> {
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
    ) : Promise<void> {
        return this.clubService.rejectApplicants(clubId, user, payload);
    }

    @Get(':clubId/applicants')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: '클럽 가입 신청자 조회' })
    @ApiOkResponse({ type: ClubMemberListDto })
    async getClubApplicants(
        @Param('clubId', ParseIntPipe) clubId: number,
        @CurrentUser() user: UserBaseInfo,
    ): Promise<ClubMemberListDto> {
        return this.clubService.getClubApplicants(clubId, user);
    }

    @Patch(':clubId/host')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: '클럽장을 위임한다' })
    @ApiNoContentResponse()
    async updateClubHost(
        @Param('clubId', ParseIntPipe) clubId: number,
        @CurrentUser() user: UserBaseInfo,
        @Body() payload: UpdateClubHostPayload,
    ) : Promise<ClubDto> {
        return this.clubService.updateClubHost(clubId,user, payload);
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
    ) :Promise<void> {
        return this.clubService.outClub(clubId, user);
    }
}