import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoryListDto } from './dto/category.dto';
import { Controller, Get } from '@nestjs/common';
import { CategoryService } from './category.service';

@Controller('categories')
@ApiTags('category API')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: '모든 카테고리' })
  @ApiOkResponse({ type: CategoryListDto })
  async findAllCategories(): Promise<CategoryListDto> {
    return this.categoryService.findAllCategories();
  }
}
