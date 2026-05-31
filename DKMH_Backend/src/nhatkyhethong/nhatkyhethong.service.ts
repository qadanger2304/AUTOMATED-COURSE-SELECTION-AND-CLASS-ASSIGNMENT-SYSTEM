import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NhatKyHeThong } from './nhatkyhethong.schema';

@Injectable()
export class NhatKyHeThongService {
  constructor(
    @InjectModel(NhatKyHeThong.name)
    private readonly nhatKyModel: Model<NhatKyHeThong>,
  ) {}

  private getCurrentDateTime(): string {
    const now = new Date();
    const pad = (num: number) => num < 10 ? '0' + num : num;
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }

  private async getNextLogId(): Promise<string> {
    const lastLog = await this.nhatKyModel.findOne().sort({ _id: -1 }).select('_id').exec();
    let nextIdNumber = 1;

    if (lastLog && lastLog._id) {
        const match = lastLog._id.match(/LOG(\d+)/);
        if (match) {
            nextIdNumber = parseInt(match[1]) + 1;
        }
    }
    return `LOG${nextIdNumber.toString().padStart(4, '0')}`;
  }

  async create(logData: Partial<NhatKyHeThong>): Promise<NhatKyHeThong> {
    if (!logData._id) {
        logData._id = await this.getNextLogId();
    }
    
    const newLog = new this.nhatKyModel({
      ...logData,
      thoi_gian: this.getCurrentDateTime(),
    });
    
    return newLog.save();
  }

  async logLoginSuccess(userId: string, userName: string, userType: string): Promise<void> {
    const logEntry: Partial<NhatKyHeThong> = {
      nguoi: userId,
      hanh_dong: 'Đăng nhập',
      chi_tiet: {
        trang_thai: 'Thành công',
        ten_nguoi_dung: userName,
        loai_tk: userType,
      },
    };
    
    this.create(logEntry).catch(err => console.error('Lỗi khi ghi log đăng nhập:', err));
  }

  async findAll(): Promise<NhatKyHeThong[]> {
    return this.nhatKyModel.find().sort({ thoi_gian: -1 }).lean().exec() as unknown as Promise<NhatKyHeThong[]>;
  }

  async deleteAll(): Promise<{ deletedCount: number }> {
    const result = await this.nhatKyModel.deleteMany({});
    return { deletedCount: result.deletedCount ?? 0 };
  }

  async deleteOne(id: string): Promise<void> {
    const result = await this.nhatKyModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Không tìm thấy nhật ký có mã ${id}`);
    }
  }
}