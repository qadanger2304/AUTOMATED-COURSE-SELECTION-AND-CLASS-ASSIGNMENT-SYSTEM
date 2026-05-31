import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { NhatKyHeThongService } from './nhatkyhethong.service';

@Controller('logs') 
export class NhatKyHeThongController {
  constructor(private readonly logService: NhatKyHeThongService) {}

  @Get()
  async getAll() {
    const logs = await this.logService.findAll();
    return {
      success: true,
      message: 'Lấy danh sách nhật ký thành công',
      data: logs,
    };
  }

  @Post()
  async create(@Body() body: any) {
    const newLog = await this.logService.create(body);
    return {
      success: true,
      message: 'Thêm nhật ký thành công',
      data: newLog,
    };
  }

  @Delete()
  async deleteAll() {
    const result = await this.logService.deleteAll();
    return {
      success: true,
      message: `Đã xóa ${result.deletedCount} nhật ký`,
    };
  }

  @Delete(':id')
  async deleteOne(@Param('id') id: string) {
    await this.logService.deleteOne(id);
    return { success: true, message: `Đã xóa log ${id}` };
  }
}
