import { ApiProperty } from '@nestjs/swagger';
import { CategoryData } from '../type/category-data.type';

export class CategoryDto {
  @ApiProperty({
    description: '카테고리 ID',
    type: Number,
  })
  id!: number;

  @ApiProperty({
    description: '카테고리이름',
    type: String,
  })
  name!: string;

  static from(category: CategoryData): CategoryDto {
    return {
      id: category.id,
      name: category.name,
    };
  }

  static fromArray(categorys: CategoryData[]): CategoryDto[] {
    return categorys.map((category) => this.from(category));
  }
}

export class CategoryListDto {
  @ApiProperty({
    description: '카테고리 목록',
    type: [CategoryDto],
  })
  categorys!: CategoryDto[];

  static from(categorys: CategoryData[]): CategoryListDto {
    return {
      categorys: CategoryDto.fromArray(categorys),
    };
  }
}
