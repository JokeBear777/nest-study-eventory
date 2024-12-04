import { ApiProperty } from '@nestjs/swagger';
import type { ClubData } from '../type/club-data';

export class ClubDto {
  @ApiProperty({
    description: '클럽 Id',
    type: Number,
  })
  id!: number;

  @ApiProperty({
    description: '클럽장 Id',
    type: Number,
  })
  hostId!: number;

  @ApiProperty({
    description: '클럽 이름',
    type: String,
  })
  name!: string;

  @ApiProperty({
    description: '클럽 설명',
    type: String,
  })
  description!: string;

  @ApiProperty({
    description: '최대 정원',
    type: Number,
  })
  maxPeople!: number;

  static from(club: ClubData): ClubDto {
    return {
      id: club.id,
      hostId: club.hostId,
      name: club.name,
      description: club.description,
      maxPeople: club.maxPeople,
    };
  }

  static fromArray(clubs: ClubData[]): ClubDto[] {
    return clubs.map((club) => this.from(club));
  }
}

export class ClubListDto {
  @ApiProperty({
    description: '클럽 목록',
    type: [ClubDto],
  })
  clubs!: ClubDto[];

  static from(clubs: ClubDto[]): ClubListDto {
    return {
      clubs: ClubDto.fromArray(clubs),
    };
  }
}
