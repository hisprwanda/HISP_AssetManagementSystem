import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RequestableItemsService } from './requestable-items.service';

@ApiTags('Requestable Items')
@Controller()
export class RequestableItemsController {
  constructor(
    private readonly requestableItemsService: RequestableItemsService,
  ) {}

  @Get('categories/:categoryId/requestable-items')
  @ApiOperation({ summary: 'Get all requestable items for a category' })
  findByCategoryId(@Param('categoryId') categoryId: string) {
    return this.requestableItemsService.findByCategoryId(categoryId);
  }

  @Post('categories/:categoryId/requestable-items')
  @ApiOperation({ summary: 'Add a requestable item to a category' })
  create(
    @Param('categoryId') categoryId: string,
    @Body() body: { name: string },
  ) {
    return this.requestableItemsService.create(categoryId, body.name);
  }

  @Delete('requestable-items/:id')
  @ApiOperation({ summary: 'Delete a requestable item' })
  remove(@Param('id') id: string) {
    return this.requestableItemsService.remove(id);
  }
}
