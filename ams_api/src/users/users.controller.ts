import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk register users' })
  bulkCreate(@Body() users: Record<string, any>[]) {
    console.log(
      `[UsersController] Bulk create request received with ${users?.length || 0} users`,
    );
    return this.usersService.bulkCreate(users);
  }

  @Post()
  @ApiOperation({ summary: 'Register a new user' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all users, optionally filtered by departmentId',
  })
  findAll(@Query('departmentId') departmentId?: string) {
    return this.usersService.findAll(departmentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific user' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get('name/:name')
  @ApiOperation({ summary: 'Get users by full name' })
  findByName(@Param('name') name: string) {
    return this.usersService.findByName(name);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user details' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a user' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
