import { ApiProperty } from '@nestjs/swagger';
import { Prisma, Status } from '@prisma/client';
import type { ClubMemberData } from '../type/club-member-data';

export class ClubMemberDto {
  @ApiProperty({
    description: '클럽 멤버 Id',
    type: Number,
  })
  id!: number;

  @ApiProperty({
    description: '클럽 Id',
    type: Number,
  })
  clubId!: number;

  @ApiProperty({
    description: '유저 Id',
    type: Number,
  })
  userId!: number;

  @ApiProperty({
    description: '멤버 상태',
    enum: Status
  })
  status!: Status;

  static from(clubMember: ClubMemberData): ClubMemberDto {
    return {
      id: clubMember.id,
      clubId: clubMember.clubId,
      userId: clubMember.userId,
      status: clubMember.status,
    };
  }

  static fromArray(clubMembers: ClubMemberData[]): ClubMemberDto[] {
    return clubMembers.map((clubMember) => this.from(clubMember));
  }
}

export class ClubMemberListDto {
  @ApiProperty({
    description: '클럽 멤버 목록',
    type: [ClubMemberDto],
  })
  clubMembers!: ClubMemberDto[];

  static from(clubMembers: ClubMemberData[]): ClubMemberListDto {
    return {
      clubMembers: ClubMemberDto.fromArray(clubMembers),
    };
  }
}