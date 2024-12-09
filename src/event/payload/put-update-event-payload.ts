import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsString, Min } from 'class-validator';

export class PutUpdateEventPayload {
  @IsString()
  @ApiProperty({
    description: '제목',
    type: String,
  })
  title!: string;

  @IsString()
  @ApiProperty({
    description: '내용',
    type: String,
  })
  description!: string;

  @IsInt()
  @ApiProperty({
    description: '카테고리',
    type: Number,
  })
  categoryId!: number;

  @IsInt()
  @ApiProperty({
    description: '지역 목록',
    type: [Number],
  })
  cityIds!: number[];

  @Type(() => Date)
  @IsDate()
  @ApiProperty({
    description: '시작 시간',
    type: Date,
  })
  startTime!: Date;

  @Type(() => Date)
  @IsDate()
  @ApiProperty({
    description: '종료 시간',
    type: Date,
  })
  endTime!: Date;

  @IsInt()
  @Min(1)
  @ApiProperty({
    description: '최대정원',
    type: Number,
  })
  maxPeople!: number;
}
