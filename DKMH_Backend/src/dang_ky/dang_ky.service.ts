import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DangKy } from './dang_ky.schema';
import { User } from '../user/user.schema';
import { NhatKyHeThongService } from '../nhatkyhethong/nhatkyhethong.service';
@Injectable()
export class DangKyService {
  constructor(
    @InjectModel(DangKy.name) private readonly dkModel: Model<DangKy>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly logService: NhatKyHeThongService,
  ) {}

  private parseDate(d: any): Date {
    if (!d) return new Date();
    if (d instanceof Date) return d;
    return new Date(d);
  }

  async create(data: Partial<DangKy>): Promise<DangKy> {
    const doc = new this.dkModel({
      ...data,
      thoi_gian_dang_ky: this.parseDate(data.thoi_gian_dang_ky),
    });
    
    const newRegistration = await doc.save();
    
    // 1. Kiểm tra và lấy ma_sv AN TOÀN
    const ma_sv_safe = data.ma_sv || newRegistration.ma_sv;
    if (!ma_sv_safe) {
         console.error('Không tìm thấy MaSV để ghi log. Bỏ qua ghi log.');
         return newRegistration;
    }

    // 2. Lấy tên Giảng viên AN TOÀN
    let giangVienName = data.ma_gv || 'Chưa phân công';
    if (data.ma_gv) {
        try {
            const gv = await this.userModel.findOne({ ma_gv: data.ma_gv }).select('ho_ten').lean();
            giangVienName = gv ? gv.ho_ten : data.ma_gv;
        } catch (error) {
            console.error(`Lỗi khi tìm tên GV (${data.ma_gv}):`, error.message);
        }
    }
    
    // 3. Lấy tên Sinh viên AN TOÀN
    let studentName = ma_sv_safe;
    try {
        const sv = await this.userModel.findOne({ ma_sv: ma_sv_safe }).select('ho_ten').lean();
        studentName = sv ? sv.ho_ten : ma_sv_safe;
    } catch (error) {
        console.error(`Lỗi khi tìm tên SV (${ma_sv_safe}):`, error.message);
    }

    // 4. Gọi hàm ghi log (Sử dụng '!' vì các trường này KHÔNG THỂ thiếu khi đăng ký)
    this.logRegistration(
        ma_sv_safe,
        studentName,
        data.ma_hoc_phan!,
        data.ten_hoc_phan!,
        data.ma_lop_hp!,
        data.phong,
        data.thu,
        data.ca,
        data.si_so_hien_tai,
        giangVienName,
        data.trang_thai?.tinh_trang || 'Đang chờ xử lý'
    );

    return newRegistration;
  }

  private logRegistration(
    ma_sv: string,
    ho_ten: string,
    ma_hp: string,
    ten_hp: string,
    ma_lhp: string,
    phong?: string,
    thu?: string,
    ca?: string,
    si_so?: number,
    giang_vien?: string,
    trang_thai: string = 'Thành công',
  ): void {
    const logEntry = {
        nguoi: ma_sv,
        hanh_dong: `Đăng ký lớp ${ma_lhp} - ${ten_hp}`,
        chi_tiet: {
            trang_thai: trang_thai,
            ten_nguoi_dung: ho_ten,
            giang_vien: giang_vien,
            phong: phong,
            thu: thu,
            ca: ca,
            si_so_hien_tai: si_so,
            ma_hoc_phan: ma_hp, 
        },
    };
    
    this.logService.create(logEntry).catch(err => console.error('LỖI KHI GHI LOG VÀO DATABASE:', err));
  }

  async findAll(): Promise<DangKy[]> {
    return this.dkModel.find().lean() as unknown as DangKy[];
  }

  async findById(id: string): Promise<DangKy> {
    const item = await this.dkModel.findById(id).lean();
    if (!item) throw new NotFoundException(`Không tìm thấy đăng ký ${id}`);
    return item as unknown as DangKy;
  }

  async findByStudent(ma_sv: string): Promise<DangKy[]> {
    return this.dkModel.find({ ma_sv }).lean() as unknown as DangKy[];
  }

  async findByClass(ma_lop_hp: string): Promise<any[]> {
    const regs = await this.dkModel.find({ ma_lop_hp }).lean();
    if (!regs.length) return [];
    
    const maSVs = regs.map(r => r.ma_sv).filter(Boolean);
    const users = await this.userModel.find({ ma_sv: { $in: maSVs } }).lean();
    const mapUser = new Map(users.map(u => [u.ma_sv, u.ho_ten]));
    
    return regs.map((r: any) => ({
        ...r,
        ho_ten: mapUser.get(r.ma_sv) || '(Không có tên)',
        thoi_gian_dang_ky: r.thoi_gian_dang_ky ? new Date(r.thoi_gian_dang_ky).toISOString() : null
    }));
  }

  async findByHocKy(hoc_ky: number): Promise<DangKy[]> {
    return this.dkModel.find({ hoc_ky }).lean() as unknown as DangKy[];
  }

  async update(id: string, data: Partial<DangKy>): Promise<DangKy> {
    const updated = await this.dkModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .lean();
    if (!updated) throw new NotFoundException(`Không tìm thấy đăng ký ${id}`);
    return updated as unknown as DangKy;
  }

  async delete(id: string) {
    await this.dkModel.deleteOne({ _id: id });
    return { deleted: true };
  }

  private async pushNotification(ma_sv: string, message: string) {
  await this.dkModel.updateMany(
    { ma_sv },
    { $push: { thong_bao: { noi_dung: message, ngay_tao: new Date() } } }
  );
}

}
