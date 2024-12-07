import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateClubPayload } from './payload/create-club-payload';
import { UserBaseInfo } from 'src/auth/type/user-base-info.type';
import { CreateClubData } from './type/create-club-data';
import { ClubRepository } from './club.repository';
import { ClubDto, ClubListDto } from './dto/club.dto';
import { PutUpdateClubPayload } from './payload/put-update-club-payload';
import { UpdateClubData } from './type/update-club-data';
import { Status } from '@prisma/client';
import { ApproveApplicantsPayload } from './payload/approve-applicants.payload';
import { RejectApplicantsPayload } from './payload/reject-applicants-payload';
import { ClubMemberListDto } from './dto/club-member.dto';

@Injectable()
export class ClubService {
  constructor(private readonly clubRepository: ClubRepository) {}

  async createClub(
    payload: CreateClubPayload,
    user: UserBaseInfo,
  ): Promise<ClubDto> {
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

    const hostId = club.hostId;
    if (hostId != user.id) {
      throw new ForbiddenException('클럽장만 수정할 수 있습니다.');
    }

    const clubHeadCount = await this.clubRepository.getClubHeadCount(clubId);
    if (payload.maxPeople < clubHeadCount) {
      throw new ConflictException('최대 인원은 현재 인원보다 적을 수 없습니다');
    }

    const updateData: UpdateClubData = {
      name: payload.name,
      description: payload.description,
      maxPeople: payload.maxPeople,
    };

    const updatedClub = await this.clubRepository.updateClub(
      clubId,
      updateData,
    );

    return ClubDto.from(updatedClub);
  }

  async deleteClub(clubId: number, user: UserBaseInfo): Promise<void> {
    const club = await this.clubRepository.getClubById(clubId);
    if (!club) {
      throw new NotFoundException('클럽이 존재하지 않습니다.');
    }

    const hostId = club.hostId;
    if (hostId != user.id) {
      throw new ForbiddenException('클럽장만 삭제할 수 있습니다.');
    }

    const date = new Date();

    await this.clubRepository.deleteClub(clubId, date);
  }

  async getClubList(): Promise<ClubListDto> {
    const clubs = await this.clubRepository.getClubList();
    return ClubListDto.from(clubs);
  }

  async joinClub(clubId: number, user: UserBaseInfo): Promise<void> {
    const club = await this.clubRepository.getClubById(clubId);
    if (!club) {
      throw new NotFoundException('클럽이 존재하지 않습니다.');
    }

    const memberStatus = await this.clubRepository.getClubMemberStatus(
      clubId,
      user.id,
    );
    if (memberStatus == Status.PENDING) {
      throw new ForbiddenException('클럽 가입 신청이 이미 진행 중입니다');
    }
    if (memberStatus == Status.APPROVED || Status.LEADER) {
      throw new ForbiddenException('이미 가입한 클럽입니다');
    }

    const clubHeadCount = await this.clubRepository.getClubHeadCount(clubId);
    if (club.maxPeople === clubHeadCount) {
      throw new ConflictException('클럽 인원이 가득차 참가할 수 없습니다');
    }

    await this.clubRepository.joinClub(clubId, user.id);
  }

  async outClub(clubId: number, user: UserBaseInfo): Promise<void> {
    const club = await this.clubRepository.getClubById(clubId);
    if (!club) {
      throw new NotFoundException('클럽이 존재하지 않습니다.');
    }

    if (user.id === club.hostId) {
      throw new ForbiddenException('클럽장은 클럽에서 탈퇴할 수 없습니다.');
    }

    const memberStatus = await this.clubRepository.getClubMemberStatus(
      clubId,
      user.id,
    );
    if (memberStatus === null) {
      throw new ConflictException('가입하지 않은 클럽은 탈퇴할 수 없습니다.');
    }

    const date = new Date();
    await this.clubRepository.outClub(clubId, user.id, date);
  }

  async approveApplicants(
    clubId: number,
    user: UserBaseInfo,
    payload: ApproveApplicantsPayload,
  ): Promise<void> {
    const club = await this.clubRepository.getClubById(clubId);
    if (!club) {
      throw new NotFoundException('클럽이 존재하지 않습니다.');
    }

    const hasInvalidUsers = await this.clubRepository.hasInvalidUsers(
      clubId,
      payload.userIds,
    );
    if (hasInvalidUsers) {
      throw new ConflictException(
        '승인 대기 중이 아니거나 탈퇴한 사용자가 포함되어 있습니다.',
      );
    }

    const hostId = club.hostId;
    if (hostId != user.id) {
      throw new ForbiddenException('클럽장만 가입 승인 할 수 있습니다.');
    }

    const clubPendingMemberCount = payload.userIds.length;
    const clubtHeadCount = await this.clubRepository.getClubHeadCount(clubId);
    const totalHeadCount = clubPendingMemberCount + clubtHeadCount;
    if (totalHeadCount > club.maxPeople) {
      const overCapacity = totalHeadCount - club.maxPeople;
      throw new ConflictException(
        `클럽 인원이 가득 찼습니다. 승인 시 ${overCapacity}명이 초과됩니다.`,
      );
    }

    await this.clubRepository.approveApplicants(clubId, payload.userIds);
  }

  async rejectApplicants(
    clubId: number,
    user: UserBaseInfo,
    payload: RejectApplicantsPayload,
  ): Promise<void> {
    const club = await this.clubRepository.getClubById(clubId);
    if (!club) {
      throw new NotFoundException('클럽이 존재하지 않습니다.');
    }

    const hasInvalidUsers = await this.clubRepository.hasInvalidUsers(
      clubId,
      payload.userIds,
    );
    if (hasInvalidUsers) {
      throw new ConflictException(
        '승인 대기 중이 아니거나 탈퇴한 사용자가 포함되어 있습니다.',
      );
    }

    const hostId = club.hostId;
    if (hostId != user.id) {
      throw new ForbiddenException('클럽장만 가입 거절 할 수 있습니다.');
    }

    await this.clubRepository.rejectApplicants(clubId, payload.userIds);
  }

  async getClubApplicants(
    clubId: number,
    user: UserBaseInfo,
  ): Promise<ClubMemberListDto> {
    const club = await this.clubRepository.getClubById(clubId);
    if (!club) {
      throw new NotFoundException('클럽이 존재하지 않습니다.');
    }

    const hostId = club.hostId;
    if (hostId != user.id) {
      throw new ForbiddenException(
        '클럽장만 가입신청자를 조회 할 수 있습니다.',
      );
    }

    const ClubMembers = await this.clubRepository.getClubApplicants(clubId);

    return ClubMemberListDto.from(ClubMembers);
  }
}
