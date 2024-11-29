import { ApiProperty } from "@nestjs/swagger";
import { IsInt } from "class-validator";

export class UpdateClubHostPayload {

    @IsInt()
    @ApiProperty({
        description: '클럽장 위임할 유저',
        type: Number,
    })
    userId!: number;
}