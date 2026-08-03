import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { GlobalSearchDto } from './dto/search.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async globalSearch(@Query() searchDto: GlobalSearchDto) {
    return this.searchService.searchAll(
      searchDto.query,
      searchDto.page,
      searchDto.limit,
    );
  }
}
