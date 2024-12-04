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
    if (memberStatus == (Status.PENDING)) {
      throw new ForbiddenException('클럽 가입 신청이 이미 진행 중입니다');
    } else if (
      memberStatus == (Status.APPROVED) ||
      (Status.LEADER)
    ) {
      throw new ForbiddenException('이미 가입한 클럽입니다');
    }

    const eventHeadCount = await this.clubRepository.getClubHeadCount(clubId);
    if (club.maxPeople === eventHeadCount) {
      throw new ConflictException('클럽 인원이 가득차 참가할 수 없습니다');
    }

    await this.clubRepository.joinClub(clubId, user.id);
  }
}
