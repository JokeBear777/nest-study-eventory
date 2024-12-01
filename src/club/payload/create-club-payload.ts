import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsSemVer, IsString, Min } from 'class-validator';

export class CreateClubPayload {
  @IsInt()
  @ApiProperty({
    description: '클럽장 Id',
    type: Number,
  })
  hostId!: number;

  @IsString()
  @ApiProperty({
    description: '클럽 이름',
    type: String,
  })
  name!: string;

  @IsString()
  @ApiProperty({
    description: '클럽 설명',
    type: String,
  })
  description!: string;

  @IsInt()
  @Min(1)
  @ApiProperty({
    description: '최대 정원',
    type: Number,
  })
  maxPeople!: number;
}
