import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

export class PutUpdateClubPayload {
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
