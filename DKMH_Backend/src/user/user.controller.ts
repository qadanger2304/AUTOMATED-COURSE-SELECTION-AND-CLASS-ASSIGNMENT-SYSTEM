import { Controller, Post, Get, Put, Delete, Body, Param, HttpCode, HttpStatus} from '@nestjs/common';
import type { UserDto } from './user.service'; 
import type { User } from './user.schema'; 
import { UserService } from './user.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NhatKyHeThongService } from '../nhatkyhethong/nhatkyhethong.service';
interface ResponseData<T> {
    success: boolean;
    message: string;
    data?: T; 
}

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService, 
    @InjectModel('DangKy') private dangKyModel: Model<any>,
    @InjectModel('Subject') private subjectModel: Model<any>,
    private readonly logService: NhatKyHeThongService,
  ) {}

  @Post('login')
  async login(@Body() body: { id: string; password: string }) {
    const result = await this.userService.login(body.id, body.password);
    
    if (result.success && result.data) {
      const userIdForLog = result.data.ma_sv || result.data.ma_gv || result.data._id; 
      this.logService.logLoginSuccess(
        userIdForLog, 
        result.data.ho_ten,
        result.data.loai
      );
    }

    return result;
  }

    
  @Get() 
  async findAll(): Promise<ResponseData<User[]>> {
    const users = await this.userService.findAll();
    return { 
        success: true, 
        message: 'Lấy danh sách người dùng thành công', 
        data: users 
    };
  } 

  @Get(':id') 
  async findOne(@Param('id') id: string): Promise<ResponseData<User>> { 
    const user = await this.userService.findOne(id);
    return { 
        success: true, 
        message: `Lấy thông tin người dùng ${id} thành công.`, 
        data: user 
    };
  }

  @Post() 
  async create(@Body() userData: UserDto): Promise<ResponseData<User>> { 
    const result = await this.userService.create(userData); 
    return { success: true, message: 'Thêm người dùng thành công.', data: result };
  }

  @Put(':id/change-password')
  async changePassword(@Param('id') id: string, @Body() body: { currentPassword: string; newPassword: string }) {
    return this.userService.changePassword(id, body.currentPassword, body.newPassword);
  }

  @Put(':id/reset-password')
  async resetPassword(@Param('id') id: string) {
    return this.userService.resetPassword(id);
  }


  @Put(':id') 
  async update(@Param('id') id: string, @Body() userData: UserDto): Promise<ResponseData<User>> { 
    const result = await this.userService.update(id, userData); 
    return { success: true, message: `Cập nhật người dùng ${id} thành công.`, data: result };
  }

  @Delete(':id') 
  @HttpCode(HttpStatus.OK) // Trả về 200 OK để Frontend dễ nhận message
  async delete(@Param('id') id: string): Promise<ResponseData<{}>> { 
    await this.userService.delete(id); 
    return { success: true, message: `Xóa người dùng ${id} thành công.` };
  }

// ----------------------------------------------------
// 🔹 API HỒ SƠ CÁ NHÂN (Giữ nguyên)
// ----------------------------------------------------
// Giữ nguyên các route này, chúng không xung đột với các route Admin.

  @Get([':id','profile/:id']) getProfile(@Param('id') id: string) { 
    return this.userService.findOne(id); 
} 

  @Put([':id','profile/:id']) 
  async updateProfile(@Param('id') id: string, @Body() userData: UserDto) {
      const { loai, mat_khau, ...dataToUpdate } = userData; 

      return this.userService.update(id, dataToUpdate); 
  }

  @Get(':id/credits/registered')
  async getRegisteredCredits(@Param('id') id: string) {
    // 1. Lấy tất cả đăng ký thành công
    const registrations = await this.dangKyModel.find({
      ma_sv: id,
      "trang_thai.tinh_trang": "Đăng ký thành công"
    }).lean();

    // 2. Lấy danh sách mã học phần
    const registeredSubjectIds = registrations.map(reg => reg.ma_hoc_phan);

    // 3. Lấy các môn tương ứng
    const subjects = await this.subjectModel.find({
      ma_hoc_phan: { $in: registeredSubjectIds }
    }).lean();

    // 4. Tính tổng tín chỉ
    let total = 0;
    for (const reg of registrations) {
      const subject = subjects.find(sub => sub.ma_hoc_phan === reg.ma_hoc_phan);
      if (subject?.so_tin_chi) total += subject.so_tin_chi;
    }

    // 5. TRẢ VỀ ĐẦY ĐỦ
    return {
      success: true,
      message: "Lấy tổng tín chỉ đã đăng ký thành công",
      data: total
    };
  }

  /** 🟩 API 2: Tổng số tín chỉ toàn bộ môn học */
  @Get('credits/all')
  async getAllCredits() {
    const subjects = await this.subjectModel.find().lean();
    const totalCredits = subjects.reduce((sum, s) => sum + (s.so_tin_chi || 0), 0);

    return {
      success: true,
      message: 'Tổng số tín chỉ của tất cả học phần',
      data: totalCredits,
    };
  }

}