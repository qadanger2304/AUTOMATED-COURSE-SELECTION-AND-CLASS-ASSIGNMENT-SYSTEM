import {Controller,Get,Post,Put,Delete,Param,Query, Body,BadRequestException,Req} from '@nestjs/common';
import { LopHocPhanService } from './lop_hoc_phan.service';

class UpdateSubjectConfigDto {
  si_so_toi_da: number;
  si_so_toi_thieu: number;
}

@Controller('lop-hoc-phan')
export class LopHocPhanController {
  constructor(private readonly service: LopHocPhanService) {}

  @Get()
  async getAll() {
    const data = await this.service.getAll();
    return { success: true, data };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const data = await this.service.getById(id);
    return { success: !!data, data };
  }

  @Post('auto-assign')
  async autoAssign(@Query('preview') preview: string, @Body() body: { min?: number; max?: number }, @Req() req: any) {
    const isPreview = preview === '1' || preview === 'true';
    const adminId = (req.user as any)?.id || (req.user as any)?._id || 'ADMIN'; 
    
    if (adminId === 'ADMIN') {
        console.warn('Cảnh báo: Không thể lấy ID người dùng từ Request. Ghi log sẽ dùng Fallback ID.');
    }

    const res = await this.service.autoAssignClasses(isPreview, body, adminId);
    return res;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const data = await this.service.update(id, body);
    return { success: true, data };
  }
  
  @Put('config/:maHocPhan')
  async updateConfig(
    @Param('maHocPhan') maHocPhan: string,
    @Query('hocKy') hocKy: string, 
    @Body() configDto: UpdateSubjectConfigDto,
  ) {
    const hk = hocKy ? Number(hocKy) : undefined;
    
    if (!hk || isNaN(hk)) {
      throw new BadRequestException('Học kỳ không hợp lệ. Vui lòng cung cấp tham số "hocKy" trong query.');
    }
    
    if (
      typeof configDto.si_so_toi_da !== 'number' || 
      typeof configDto.si_so_toi_thieu !== 'number'
    ) {
      throw new BadRequestException('Dữ liệu sĩ số tối đa và tối thiểu phải là số.');
    }

    const updated = await this.service.updateSubjectConfig(
      maHocPhan, 
      hk, 
      configDto
    );
    return { success: true, message: 'Cấu hình sĩ số đã được lưu.', data: updated };
  }
  // -------------------------------------------------------------


  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.service.delete(id);
    return { success: true, message: 'Xóa lớp thành công' };
  }

  @Get('registrations/summary')
  async registrationSummary(@Query('hocKy') hocKy: string) {
    const hk = hocKy ? Number(hocKy) : undefined;
    const data = await this.service.getRegistrationSummary(hk);
    return { success: true, data };
  }

  @Get('registrations/:maHocPhan')
  async registrationsBySubject(@Param('maHocPhan') maHocPhan: string, @Query('hocKy') hocKy: string) {
    const hk = hocKy ? Number(hocKy) : undefined;
    const data = await this.service.getRegistrationsBySubject(maHocPhan, hk);
    return { success: true, data };
  } 

    
}