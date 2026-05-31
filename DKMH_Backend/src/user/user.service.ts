import { Injectable, NotFoundException,BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';

export type UserDto = Omit<User, 'mat_khau'> & { mat_khau?: string };

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async login(id: string, password: string) {
    console.log('>>> Kiểm tra người dùng:', id, password);

    const user = await this.userModel.findOne({ _id: id, mat_khau: password }).lean();

    if (!user) {
      console.log('>>> Không tìm thấy người dùng');
      return { success: false, message: 'Không tìm thấy người dùng' };
    }

    console.log('>>> Tìm thấy người dùng:', user.ho_ten, '| Loại:', user.loai);

    const userData: any = {
      _id: user._id,
      ho_ten: user.ho_ten,
      loai: user.loai,
      email: user.email,
    };

    switch (user.loai) {
      case 'Sinh viên':
        userData.ma_sv = user.ma_sv;
        userData.lop = user.lop;
        userData.khoa_hoc = user.khoa_hoc;
        userData.trang_thai = user.trang_thai;
        break;

      case 'Giảng viên':
        userData.ma_gv = user.ma_gv;
        userData.bo_mon = user.nganh_day;
        break;

      case 'Quản trị viên':
      case 'Admin':
      case 'Quản trị':
        userData.chuc_vu = user.chuc_vu;
        break;

      default:
        console.log('>>> Loại người dùng không xác định:', user.loai);
        return { success: false, message: 'Loại người dùng không xác định!' };
    }

    return {
      success: true,
      data: userData,
    };
  }

  async create(userData: UserDto): Promise<User> {
        const newUser = new this.userModel(userData);
        return newUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-mat_khau').lean().exec() as unknown as Promise<User[]>; 
}

async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-mat_khau').lean().exec();
    if (!user) throw new NotFoundException(`Không tìm thấy người dùng với mã ${id}`);
    return user as unknown as User; 
}

    async update(id: string, userData: Partial<UserDto>): Promise<User> {
      const cleanData = { ...userData };
      delete cleanData._id;
      delete cleanData.mat_khau;

      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, { $set: cleanData }, { new: true })
        .select('-mat_khau')
        .lean();

      if (!updatedUser)
        throw new NotFoundException(`Không tìm thấy người dùng với mã ${id}`);

      return updatedUser as unknown as User;
  }

    
  async delete(id: string): Promise<{ deletedCount?: number }> {
        const result = await this.userModel.deleteOne({ _id: id }).exec();
        if (result.deletedCount === 0) throw new NotFoundException(`Không tìm thấy người dùng với mã ${id} để xóa.`);
        return result;
  }
    
  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await this.userModel.findById(id).lean();

    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID ${id}`);
    }

    if (user.mat_khau !== currentPassword) {
      throw new BadRequestException('WRONG_PASSWORD');
    }

    await this.userModel.updateOne({ _id: id }, { mat_khau: newPassword });

    return {
      success: true,
      message: 'Đổi mật khẩu thành công!',
    };
  }

  async resetPassword(id: string) {
    const user = await this.userModel.findById(id).lean();

    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID ${id}`);
    }

    await this.userModel.updateOne(
      { _id: id },
      { $set: { mat_khau: "123" } }
    );

    return {
      success: true,
      message: "Reset mật khẩu thành công!",
      newPassword: "123"
    };
  }

}
