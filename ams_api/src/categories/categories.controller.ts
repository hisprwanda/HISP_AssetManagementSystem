import { from } from "rxjs";
import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new asset category (Unique names only)' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  findAll() {
    return this.categoriesService.findAll();
  }


  @Get(':id')
  @ApiOperation({ summary: 'Get a specific category by UUID' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  // Search by name route
  @Get('search')
  @ApiOperation({ summary: 'Find a category by its name' })
  @ApiQuery({ name: 'name', required: true, type: String })
  findByName(@Query('name') name: string) {
    return this.categoriesService.findByName(name);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update category details' })
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}