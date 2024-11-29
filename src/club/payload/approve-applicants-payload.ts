import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, IsArray, IsInt } from "class-validator";

export class ApproveApplicantsPayload {

    @IsArray()
    @ArrayNotEmpty()
    @IsInt({each: true})
    @ApiProperty({
        description: '가입 승인할 유저 목록',
        type: [Number],
    })
    userIds!: number[];

}