import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';

export class RejectApplicantsPayload {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @ApiProperty({
    description: '가입 거절할 유저 목록',
    type: [Number],
  })
  userIds!: number[];
}
