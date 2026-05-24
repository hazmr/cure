import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { UserRole } from '../database/enums';
import { BookingsService } from './bookings.service';
import { BookingQueryDto } from './dto/booking-query.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@ApiTags('bookings')
@ApiBearerAuth()
@Controller('bookings')
@Roles(UserRole.ADMIN, UserRole.NURSE, UserRole.PATIENT)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Body() dto: CreateBookingDto, @CurrentUser() user: RequestUser) {
    return this.bookingsService.create(dto, user);
  }

  @Get()
  list(@Query() query: BookingQueryDto, @CurrentUser() user: RequestUser) {
    return this.bookingsService.list(query, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.bookingsService.findOne(id, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBookingDto, @CurrentUser() user: RequestUser) {
    return this.bookingsService.update(id, dto, user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.bookingsService.updateStatus(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.bookingsService.remove(id, user);
  }
}

