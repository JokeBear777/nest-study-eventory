import { ConflictException, ForbiddenException, Injectable, NotFoundException, Put } from "@nestjs/common";
import type { ClubRepository } from "./club.repository";
import type { CreateClubPayload } from "./payload/create-club-payload";
import type { UserBaseInfo } from "src/auth/type/user-base-info.type";
import { ClubDto } from "./dto/ClubDto";
import type { CreateClubData } from "./type/create-club-data";
import type { PutUpdateClubPayload } from "./payload/put-update-club-payload";
import type { UpdateClubData } from "./type/update-club-data";
import type { ClubMemberStatus } from "./type/club-member-status";
import type { ApproveApplicantsData } from "./type/approve-applicants-data";
import type { RejectApplicantsPayload } from "./payload/reject-applicants-payload";
import type { ApproveApplicantsPayload } from "./payload/approve-applicants-payload";
import type { RejectApplicantsData } from "./type/reject-applicants-data";
import { ClubMemberListDto } from "./dto/ClubMemberDto";
import type { UpdateClubHostPayload } from "./payload/update-club-host-payload";


@Injectable()
export class ClubService {

    constructor(private readonly clubRepository: ClubRepository) {}

    async createClub(payload: CreateClubPayload, user:UserBaseInfo): Promise<ClubDto>{
        
        const createData: CreateClubData = {
            hostId: user.id,
            name: payload.name,
            description: payload.description,
            maxPeople: payload.maxPeople,
        };

        const club = await this.clubRepository.createClub(createData);

        return ClubDto.from(club);
    }

    async putUpdateClub(
        clubId: number,
        payload: PutUpdateClubPayload,
        user: UserBaseInfo,
    ): Promise<ClubDto> {

        const club = await this.clubRepository.getClubById(clubId);
        if (!club) {
            throw new NotFoundException('클럽이 존재하지 않습니다.');
        }

        const hostId = await this.clubRepository.getHostIdByClubId(clubId);
        if(hostId != user.id) {
            throw new ForbiddenException('클럽장만 수정할 수 있습니다.');
        }

        const eventHeadCount = await this.clubRepository.getClubHeadCount(clubId);
        if (payload.maxPeople < eventHeadCount) {
            throw new ConflictException('최대 인원은 현재 인원보다 적을 수 없습니다');
        }

        const updateData: UpdateClubData = {
            name: payload.name,
            description: payload.description,
            maxPeople: payload.maxPeople,
        };
        
        const updatedClub = await this.clubRepository.updateClub(clubId, updateData);

        return ClubDto.from(updatedClub);
    }

    async deleteClub(clubId: number, user: UserBaseInfo): Promise<void> {
        const club = await this.clubRepository.getClubById(clubId);
        if (!club) {
            throw new NotFoundException('클럽이 존재하지 않습니다.');
        }

        const hostId = await this.clubRepository.getHostIdByClubId(clubId);
        if(hostId != user.id) {
            throw new ForbiddenException('클럽장만 삭제할 수 있습니다.');
        }

        await this.clubRepository.deleteClub(clubId);
    }

    async joinClub(clubId: number, user : UserBaseInfo) : Promise<void> {
        const club = await this.clubRepository.getClubById(clubId);
        if (!club) {
            throw new NotFoundException('클럽이 존재하지 않습니다.');
        }

        const memberStatus = await this.clubRepository.getClubMemberStatus(clubId, user.id);
        if (memberStatus == 'PENDING' as ClubMemberStatus ) {
            throw new ForbiddenException('클럽 가입 신청이 이미 진행 중입니다')
        }
        else if (memberStatus == 'APPROVED' as ClubMemberStatus ||
            'LEADER' as ClubMemberStatus
        ) {
            throw new ForbiddenException('이미 가입한 클럽입니다')
        }

        const eventHeadCount = await this.clubRepository.getClubHeadCount(clubId);
        if (club.maxPeople === eventHeadCount) {
          throw new ConflictException('클럽 인원이 가득차 참가할 수 없습니다');
        }

        await this.clubRepository.joinClub(clubId, user.id);
    }

    async approveApplicants(clubId: number, user: UserBaseInfo, payload: ApproveApplicantsPayload) : Promise<void> {
        const club = await this.clubRepository.getClubById(clubId);
        if (!club) {
            throw new NotFoundException('클럽이 존재하지 않습니다.');
        }
          
        const clubPendingMemberCount = await this.clubRepository.countClubPendingMembersById(clubId,payload.userIds);
        if (clubPendingMemberCount != payload.userIds.length) {
            throw new ConflictException('요청한 사용자 중 승인 대기 상태가 아닌 유저가 포함되어 있습니다');
        }

        const hostId = await this.clubRepository.getHostIdByClubId(clubId);
        if(hostId != user.id) {
            throw new ForbiddenException('클럽장만 가입 승인 할 수 있습니다.');
        }


        const eventHeadCount = await this.clubRepository.getClubHeadCount(clubId);
        const totalHeadCount = clubPendingMemberCount + eventHeadCount;
        if (totalHeadCount >= club.maxPeople) {
          const overCapacity = totalHeadCount - club.maxPeople + 1; 
          throw new ConflictException(`클럽 인원이 가득 찼습니다. 승인 시 ${overCapacity}명이 초과됩니다.`);
        }

        const data: ApproveApplicantsData = {
            userIds: payload.userIds,
        };

        await this.clubRepository.approveApplicants(clubId, data);
    }

    async rejectApplicants(clubId: number, user: UserBaseInfo, payload: RejectApplicantsPayload) :Promise<void> {
        const club = await this.clubRepository.getClubById(clubId);
        if (!club) {
            throw new NotFoundException('클럽이 존재하지 않습니다.');
        }

        const clubPendingMemberCount = await this.clubRepository.countClubPendingMembersById(clubId,payload.userIds);
        if (clubPendingMemberCount != payload.userIds.length) {
            throw new ConflictException('요청한 사용자 중 승인 대기 상태가 아닌 유저가 포함되어 있습니다');
        }

        const hostId = await this.clubRepository.getHostIdByClubId(clubId);
        if(hostId != user.id) {
            throw new ForbiddenException('클럽장만 가입 거절 할 수 있습니다.');
        }

        const data: RejectApplicantsData = {
            userIds: payload.userIds,
        };

        await this.clubRepository.rejectApplicants(clubId, data);
    }

    async getClubApplicants(clubId: number, user : UserBaseInfo) : Promise<ClubMemberListDto> {
        const club = await this.clubRepository.getClubById(clubId);
        if (!club) {
            throw new NotFoundException('클럽이 존재하지 않습니다.');
        }

        const hostId = await this.clubRepository.getHostIdByClubId(clubId);
        if(hostId != user.id) {
            throw new ForbiddenException('클럽장만 가입신청자를 조회 할 수 있습니다.');
        }

        const ClubMembers = await this.clubRepository.getClubApplicants(clubId);

        return ClubMemberListDto.from(ClubMembers);

    }

    async updateClubHost(clubId: number, user: UserBaseInfo, payload:UpdateClubHostPayload): Promise<ClubDto> {
        const club = await this.clubRepository.getClubById(clubId);
        if (!club) {
            throw new NotFoundException('클럽이 존재하지 않습니다.');
        }

        const hostId = await this.clubRepository.getHostIdByClubId(clubId);
        if(hostId != user.id) {
            throw new ForbiddenException('클럽장만 클럽의 클럽장을 양도할 수 있습니다');
        }

        const nextHostStatus = await this.clubRepository.getClubMemberStatus(clubId, payload.userId);
        if (nextHostStatus != 'APPROVED') {
            throw new ConflictException('클럽에 가입된 상태의 유저만 클럽장이 될 수 있습니다');
        }

        const updatedClub = await this.clubRepository.updateClubHost(clubId, user.id, payload.userId);

        return ClubDto.from(updatedClub);
    }

    async outClub(clubId: number, user: UserBaseInfo) :Promise<void> {
        const club = await this.clubRepository.getClubById(clubId);
        if (!club) {
            throw new NotFoundException('클럽이 존재하지 않습니다.');
        }

        const hostId = await this.clubRepository.getHostIdByClubId(clubId);
        if(hostId === user.id) {
            throw new ForbiddenException('클럽장은 클럽에서 탈퇴할 수 없습니다.');
        }

        //클럽 모임 구현 후 활성화
        /** 
        const isParticipatingClubEvent = await this.clubRepository.isParticipatingClubEventById(clubId, user.id);
        if (isParticipatingClubEvent) {
            throw new ConflictException('클럽 모임 모두 탈퇴 후 클럽에서 탈퇴할 수 있습니다.');
        }
            **/ 

        await this.clubRepository.outClub(clubId, user.id);
    }




}