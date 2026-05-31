import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NhatKyHeThongService } from '../nhatkyhethong/nhatkyhethong.service';
import { DangKy } from '../dang_ky/dang_ky.schema';
import { LopHocPhan } from './lop_hoc_phan.schema';
import { Subject } from '../subject/subject.schema';
import { GiangVien } from '../giang_vien/giang_vien.schema';
import { ThuHoc } from '../thu_hoc/thu_hoc.schema';
import { CaHoc } from '../ca_hoc/ca_hoc.schema';
import { PhongHoc } from '../phong_hoc/phong_hoc.schema';
import { BuoiHoc } from '../buoi_hoc/buoi_hoc.schema';
import { User} from '../user/user.schema';
import { LopHocPhanConfig } from './lop_hoc_phan_config.schema';
import { NhatKyHeThong } from 'src/nhatkyhethong/nhatkyhethong.schema';
@Injectable()
export class LopHocPhanService {
  private readonly logger = new Logger(LopHocPhanService.name);

  constructor(
    @InjectModel(DangKy.name) private dangKyModel: Model<DangKy>,
    @InjectModel(LopHocPhan.name) private lopHPModel: Model<LopHocPhan>,
    @InjectModel(Subject.name) private subjectModel: Model<Subject>,
    @InjectModel(GiangVien.name) private gvModel: Model<GiangVien>,
    @InjectModel(ThuHoc.name) private thuHocModel: Model<ThuHoc>,
    @InjectModel(CaHoc.name) private caHocModel: Model<CaHoc>,
    @InjectModel(PhongHoc.name) private phongModel: Model<PhongHoc>,
    @InjectModel(BuoiHoc.name) private buoiModel: Model<BuoiHoc>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(LopHocPhanConfig.name) private configModel: Model<LopHocPhanConfig>,
    private readonly logService: NhatKyHeThongService,
  ) {}

  private parseDateField(d: any): Date {
    if (!d) return new Date();
    if (d instanceof Date) return d;
    if (typeof d === 'string') return new Date(d);
    if (typeof d === 'object' && (d.$date || d['$date'])) {
      return new Date(d.$date || d['$date']);
    }
    try {
      return new Date(d.toString());
    } catch {
      return new Date();
    }
  }

  private chooseBestThu(): string[] {
    const arr = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'];
    return arr.sort(() => Math.random() - 0.5);
  }

  private candidateStartsForDuration(duration: number, buoi: 'Sáng' | 'Chiều'): number[] {
    const morningMax = 6;
    const afternoonMax = 12;
    const starts: number[] = [];
    if (buoi === 'Sáng') {
      for (let s = 1; s <= morningMax; s++) {
        if (s + duration - 1 <= morningMax) starts.push(s);
      }
    } else {
      for (let s = 7; s <= afternoonMax; s++) {
        if (s + duration - 1 <= afternoonMax) starts.push(s);
      }
    }
    return starts;
  }

  private tickLabel(n: number) { return `Tiết ${n}`; }

  private hasConflict(newThu: string, newTiets: number[], existingList: { thu: string, tiet: number[] }[]) {
    for (const it of existingList) {
      if (it.thu !== newThu) continue;
      for (const t of newTiets) {
        if (it.tiet.includes(t)) return true;
      }
    }
    return false;
  }

  private groupBySubject(list: DangKy[]) {
    const result: Record<string, DangKy[]> = {};
    for (const dk of list) {
      if (!dk || !dk.ma_hoc_phan) continue;
      const key = String(dk.ma_hoc_phan).trim();
      if (!key) continue;
      if (!result[key]) result[key] = [];
      result[key].push(dk);
    }
    return result;
  }

  

  // CHỨC NĂNG: CẬP NHẬT CẤU HÌNH SĨ SỐ 
  async updateSubjectConfig(maHocPhan: string, hocKy: number, config: { si_so_toi_da: number, si_so_toi_thieu: number }) {
    this.logger.log(`Cập nhật sĩ số cho ${maHocPhan} HK ${hocKy}: MAX=${config.si_so_toi_da}, MIN=${config.si_so_toi_thieu}`);
    
    if (!maHocPhan || typeof hocKy === 'undefined' || isNaN(hocKy)) {
      throw new BadRequestException('Thiếu mã học phần hoặc học kỳ hợp lệ.');
    }
    
    const { si_so_toi_da, si_so_toi_thieu } = config;
    
    if (si_so_toi_thieu > si_so_toi_da) {
        throw new BadRequestException('Sĩ số tối thiểu không được lớn hơn sĩ số tối đa.');
    }

    const updatedConfig = await this.configModel.findOneAndUpdate(
      { ma_hoc_phan: maHocPhan, hoc_ky: Number(hocKy) },
      { $set: { 
        si_so_toi_da: Number(si_so_toi_da),
        si_so_toi_thieu: Number(si_so_toi_thieu),
      }},
      { upsert: true, new: true, runValidators: true }
    ).lean();

    return updatedConfig;
  }

  private logClassAssignment(totalClasses: number, updatedRegistrations: number, createdBy: string): void {
    const logEntry = {
        nguoi: createdBy, 
        hanh_dong: `Phân lớp tự động thành công`,
        chi_tiet: {
            trang_thai: 'Thành công',
            tổng_số_lớp_mới: totalClasses,
            tổng_số_đăng_ký_đã_cập_nhật: updatedRegistrations,
            ghi_chú: `Hệ thống đã tự động tạo ${totalClasses} lớp học phần và cập nhật trạng thái của ${updatedRegistrations} đăng ký liên quan.`,
        },
    };
    
    this.logService.create(logEntry as Partial<NhatKyHeThong>).catch(err => this.logger.error('LỖI KHI GHI LOG PHÂN LỚP:', err));
}

  async autoAssignClasses(preview = false, config: { min?: number; max?: number }, adminId: string) {
    this.logger.log('>>> BẮT ĐẦU PHÂN LỚP TỰ ĐỘNG (preview=' + preview + ') ...');

    // load data
    const dangKyRaw = await this.dangKyModel.find().lean();
    const subjects = await this.subjectModel.find().lean();
    const giangVien = await this.gvModel.find().lean();
    const thuHocList = await this.thuHocModel.find().lean();
    const caHocList = await this.caHocModel.find().lean();
    const phongList = await this.phongModel.find().lean();
    const buoiList = await this.buoiModel.find().lean();
    const allCustomConfigs = await this.configModel.find().lean();
    const configMap = new Map(allCustomConfigs.map(c => [`${c.ma_hoc_phan}_${c.hoc_ky}`, c]));

    const dangKy = Array.isArray(dangKyRaw) ? (dangKyRaw as unknown as DangKy[]) : [];

    this.logger.log('Loaded: ' + JSON.stringify({
      dangKy: dangKy.length,
      subjects: Array.isArray(subjects) ? subjects.length : 0,
      giangVien: Array.isArray(giangVien) ? giangVien.length : 0,
      thuHoc: Array.isArray(thuHocList) ? thuHocList.length : 0,
      caHoc: Array.isArray(caHocList) ? caHocList.length : 0,
      phong: Array.isArray(phongList) ? phongList.length : 0,
      buoi: Array.isArray(buoiList) ? buoiList.length : 0,
    }));

    if (!dangKy.length) {
      return { success: false, message: 'Không có dữ liệu đăng ký!' };
    }

    const validDK = dangKy.filter(dk => dk && dk.ma_hoc_phan && typeof dk.ma_hoc_phan === 'string') as DangKy[];
    const grouped = this.groupBySubject(validDK);

    this.logger.log('GROUP KEYS: ' + JSON.stringify(Object.keys(grouped)));

    const results: any[] = [];
    const assignments: Record<string, string> = {};

    const studentSchedules: Record<string, {thu: string, tiet: number[]}[]> = {};
    const markStudentSchedule = (svId: string, thu: string, tiet: number[]) => {
    if (!studentSchedules[svId]) studentSchedules[svId] = [];
    studentSchedules[svId].push({ thu, tiet });
    };

    const gvSchedules: Record<string, { thu: string, tiet: number[] }[]> = {};
    const roomSchedules: Record<string, { thu: string, tiet: number[] }[]> = {};
    const markSchedules = (ma: string | null | undefined, thu: string, tiet: number[], map: Record<string, {thu:string,tiet:number[]}[]>) => {
      if (!ma) return;
      if (!map[ma]) map[ma] = [];
      map[ma].push({ thu, tiet });
    };

    for (const ma_hoc_phan of Object.keys(grouped)) {
      const dkList = grouped[ma_hoc_phan];
      const firstDK = dkList[0];
      const hocKy = typeof firstDK?.hoc_ky !== 'undefined' ? Number(firstDK.hoc_ky) : undefined;
      if (typeof hocKy === 'undefined') {
          this.logger.warn(`⚠️ Môn ${ma_hoc_phan}: Không xác định được Học kỳ -> bỏ qua.`);
          continue;
      }
      const subject = (Array.isArray(subjects) ? subjects : []).find(s => s.ma_hoc_phan === ma_hoc_phan);
      if (!subject) {
        this.logger.warn(`⚠️ Môn ${ma_hoc_phan} không tồn tại trong subjects -> bỏ qua`);
        continue;
      }

      const customConfig = configMap.get(`${ma_hoc_phan}_${hocKy}`);
      const MIN = customConfig?.si_so_toi_thieu ?? 7;
      const MAX = customConfig?.si_so_toi_da ?? 10;
      this.logger.log(`>> Môn ${ma_hoc_phan} HK ${hocKy}: Dùng sĩ số MAX=${MAX}, MIN=${MIN}`);

      const soBuoiHoc = subject?.so_buoi_hoc ?? 15;
      const duration = soBuoiHoc === 10 ? 5 : 3;

      dkList.sort((a, b) => {
        const ta = this.parseDateField(a?.thoi_gian_dang_ky);
        const tb = this.parseDateField(b?.thoi_gian_dang_ky);
        return ta.getTime() - tb.getTime();
      });

      const rawGroups: DangKy[][] = [];
      let temp: DangKy[] = [];
      for (const dk of dkList) {
        if (!dk) continue;
        if (temp.length >= MAX) {
          rawGroups.push(temp);
          temp = [];
        }
        temp.push(dk);
      }
      if (temp.length) rawGroups.push(temp);

      const finalClasses: DangKy[][] = [];
      const smallGroups: DangKy[][] = [];
      for (const g of rawGroups) {
        if (g.length >= MIN) finalClasses.push(g.slice()); else smallGroups.push(g.slice());
      }

      if (finalClasses.length === 0 && smallGroups.length) {
        const merged = smallGroups.flat();
        for (let i = 0; i < merged.length; i += MAX) {
          finalClasses.push(merged.slice(i, i + MAX));
        }
      } else if (smallGroups.length) {
        const leftover = smallGroups.flat();
        for (const sv of leftover) {
          let placed = false;
          for (const fc of finalClasses) {
            if (fc.length < MAX) {
              fc.push(sv);
              placed = true;
              break;
            }
          }
          if (!placed) finalClasses.push([sv]);
        }
      }

      const keptFinal = finalClasses.filter(fc => fc.length >= MIN);
      if (!keptFinal.length) {
        this.logger.warn(`➡️ Môn ${ma_hoc_phan}: không có lớp nào đạt MIN (${MIN}) -> bỏ qua tạo lớp.`);
        continue;
      }

      let classIndex = 1;
      const buoiOrder = ['Sáng', 'Chiều'];

      for (const group of keptFinal) {
        const maHP = subject.ma_hoc_phan;
        const tenHP = subject.ten_hoc_phan;
        const ma_lop_hp = `LHP_${maHP}_${String(classIndex).padStart(2, '0')}`;

        // candidate GVs by rules
        const candidateGVs = (Array.isArray(giangVien) ? giangVien : []).filter(gv => {
          if (!gv || !gv.nganh_day) return false;
          const pham_vi = subject.pham_vi;
          if (gv.nganh_day === 'Công nghệ thông tin' && pham_vi === 'Chuyên ngành') return true;
          if (gv.nganh_day === 'Giáo dục đại cương' && pham_vi === 'Học phần chung') {
            if (
              tenHP.includes('Giáo dục thể chất') ||
              tenHP.includes('Giáo dục quốc phòng') ||
              tenHP.includes('Thực tập') ||
              tenHP.includes('Khóa luận')
            ) return false;
            return true;
          }
          if (gv.nganh_day === 'Giáo dục thể chất' && tenHP.includes('Giáo dục thể chất')) return true;
          if (gv.nganh_day === 'Giáo dục an ninh' && tenHP.includes('Giáo dục quốc phòng')) return true;
          return false;
        });

        let assignedThu: string | null = null;
        let assignedStart = 0;
        let assignedEnd = 0;
        let assignedBuoiMa: string | null = null;
        let assignedRoom: any = null;
        let assignedGV: any = null;
        
        outer:
        for (const buoi of buoiOrder) {
          const starts = this.candidateStartsForDuration(duration, buoi as 'Sáng'|'Chiều');
          if (!starts.length) continue;

          const buoiRec = (Array.isArray(buoiList) ? buoiList : []).find(b => b.buoi === buoi);
          const maBuoiVal = buoiRec ? (buoiRec as any).ma_buoi : (buoi === 'Sáng' ? 'BUOI01' : 'BUOI02');

          const thuOptions = this.chooseBestThu();
          for (const thu of thuOptions) {
            const shuffledStarts = [...starts].sort(() => Math.random() - 0.5);
            for (const s of shuffledStarts) {
              const e = s + duration - 1;
              const tietArr: number[] = [];
              for (let t = s; t <= e; t++) tietArr.push(t);

              const roomCandidates = (Array.isArray(phongList) ? phongList : []).filter((p: any) => {
                const ten = String(tenHP || '').trim();
                const loaiPhong = String((p as any).loai_phong || '').trim().toLowerCase();

                if (ten.startsWith('Giáo dục quốc phòng')) {
                  return loaiPhong.includes('ngoài') || loaiPhong.includes('qp') || loaiPhong.includes('ngoài sân');
                }
                if (ten.startsWith('Giáo dục thể chất')) {
                  return loaiPhong.includes('ngoài') || loaiPhong.includes('gdtc') || loaiPhong.includes('ngoài sân');
                }
                if (duration === 5) {
                  return loaiPhong.includes('thực hành') || loaiPhong.includes('lab') || loaiPhong.includes('phòng thực hành') || loaiPhong.includes('máy');
                } else {
                  return loaiPhong.includes('lý thuyết') || loaiPhong.includes('ly thuyet') || loaiPhong.includes('giảng') || loaiPhong.includes('phòng học') || loaiPhong.includes('class');
                }
              });

              const roomsToTry = roomCandidates.length ? roomCandidates : (Array.isArray(phongList) ? phongList : []);         
              let conflictSV = false;
              for (const sv of group) {
                const svId = String(sv.ma_sv);
                const sched = studentSchedules[svId] || [];
                if (this.hasConflict(thu, tietArr, sched)) {
                    conflictSV = true;
                    break;
                }
              }
              if (conflictSV) continue;
              for (const room of roomsToTry) {
                const rId = (room as any).ma_phong || (room as any)._id;
                const roomSched = roomSchedules[rId] || [];
                if (this.hasConflict(thu, tietArr, roomSched)) continue;

                for (const gv of candidateGVs) {
                  const gvId = gv.ma_gv || (gv as any)._id;
                  const gvSched = gvSchedules[gvId] || [];
                  if (this.hasConflict(thu, tietArr, gvSched)) continue;

                  // assign
                  assignedThu = thu;
                  assignedStart = s;
                  assignedEnd = e;
                  assignedBuoiMa = maBuoiVal;
                  assignedRoom = room;
                  assignedGV = gv;

                  markSchedules(gvId, thu, tietArr, gvSchedules);
                  markSchedules(rId, thu, tietArr, roomSchedules);
                  for (const sv of group) {
                    const svId = String(sv.ma_sv);
                    markStudentSchedule(svId, assignedThu, tietArr);
                }
                  break;
                }

                if (assignedGV) break;
              }

              if (assignedGV) break;
            }

            if (assignedGV) break;
          }

          if (assignedGV) break;
        }

        if (!assignedGV) {
          this.logger.warn(`Fallback assign for ${ma_lop_hp}: dùng slot đầu, có thể trùng lịch`);
          const thuOptions = this.chooseBestThu();
          const thu = thuOptions[Math.floor(Math.random()*thuOptions.length)];
          const buoi = 'Sáng';
          const starts = this.candidateStartsForDuration(duration, buoi as 'Sáng'|'Chiều');
          const s = starts.length ? starts[0] : 1;
          const e = s + duration - 1;
          const tietArr: number[] = [];
          for (let t = s; t <= e; t++) tietArr.push(t);
          const room = (Array.isArray(phongList) && phongList.length) ? phongList[0] : null;
          const gv = (Array.isArray(giangVien) && giangVien.length) ? giangVien[0] : null;
          const roomId = room ? ((room as any).ma_phong || (room as any)._id) : null;
          const gvId = gv ? (gv.ma_gv || (gv as any)._id) : null;
          markSchedules(gvId, thu, tietArr, gvSchedules);
          markSchedules(roomId, thu, tietArr, roomSchedules);
          assignedThu = thu;
          assignedStart = s;
          assignedEnd = e;
          assignedRoom = room;
          assignedGV = gv;
          assignedBuoiMa = (buoi === 'Sáng') ? ((Array.isArray(buoiList) ? (buoiList.find(b=>b.buoi==='Sáng') as any)?.ma_buoi : 'BUOI01')) : ((Array.isArray(buoiList) ? (buoiList.find(b=>b.buoi==='Chiều') as any)?.ma_buoi : 'BUOI02'));
        }

        const ca_dau = this.tickLabel(assignedStart);
        const ca_cuoi = this.tickLabel(assignedEnd);
        const tietList: number[] = [];
        for (let t = assignedStart; t <= assignedEnd; t++) tietList.push(t);

        const firstDK = group[0];
        const d = this.parseDateField(firstDK?.thoi_gian_dang_ky);
        d.setMonth(d.getMonth() + 1);
        const ngay_bat_dau = d;
        const ngay_ket_thuc = new Date(ngay_bat_dau);
        ngay_ket_thuc.setDate(ngay_bat_dau.getDate() + (7 * (soBuoiHoc || 10)));

        const roomCode = assignedRoom ? ((assignedRoom as any).ma_phong || (assignedRoom as any)._id) : null;
        const gvCode = assignedGV ? (assignedGV.ma_gv || (assignedGV as any)._id) : null;

        results.push({
          _id: ma_lop_hp,
          ma_lop_hp,
          ma_hoc_phan: maHP,
          ten_hoc_phan: tenHP,
          ma_gv: gvCode,
          thu: assignedThu,
          ma_buoi: assignedBuoiMa,
          ca_dau,
          ca_cuoi,
          phong: roomCode,
          so_buoi_hoc: soBuoiHoc,
          si_so_toi_da: MAX,
          si_so_hien_tai: group.length,
          si_so_toi_thieu: MIN,
          ngay_bat_dau,
          ngay_ket_thuc,
          hoc_ky: hocKy,
        });

        for (const dk of group) {
          if (dk && dk._id) assignments[String(dk._id)] = ma_lop_hp;
        }

        classIndex++;
      }
    } // each subject

    this.logger.log('>>> PHÂN LỚP HOÀN TẤT (generate). Tổng lớp: ' + results.length);

    if (preview) {
      return {
        success: true,
        preview: true,
        total: results.length,
        data: results,
        assignments,
      };
    }

    this.logger.log('>>> Lưu dữ liệu lớp học phần vào MongoDB...');
    await this.lopHPModel.deleteMany({});
    if (results.length) {
      await this.lopHPModel.insertMany(results);
    }

    const ops = Object.keys(assignments).map(dkId => {
      const maLop = assignments[dkId];
      return {
        updateOne: {
          filter: { _id: dkId },
          update: {
            $set: {
              ma_lop_hp: maLop,
              'trang_thai.tinh_trang': 'Đăng ký thành công',
              'trang_thai.chi_tiet': `Được phân vào lớp ${maLop} tự động.`,
            },
          },
        },
      };
    });
    const updatedRegCount = Object.keys(assignments).length;

    if (ops.length) {
      await this.dangKyModel.bulkWrite(ops);
      this.logClassAssignment(results.length, updatedRegCount, adminId);
    }

    return {
      success: true,
      preview: false,
      total: results.length,
      data: results,
      updatedRegistrations: updatedRegCount,
    };
  }

  async getAll() {
    return await this.lopHPModel.find().lean();
  }

  async getById(id: string) {
    return await this.lopHPModel.findById(id).lean();
  }

  async update(id: string, data: any) {
    if ('_id' in data) delete data._id;
    return await this.lopHPModel.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  async delete(id: string) {
    return await this.lopHPModel.findByIdAndDelete(id);
  }

  async getRegistrationSummary(hocKy?: number) {
    const filter: any = {};
    if (typeof hocKy === 'number' && !isNaN(hocKy)) {
      filter.hoc_ky = hocKy;
    }
    const agg = await this.dangKyModel.aggregate([
      { $match: filter },
      { $group: { _id: '$ma_hoc_phan', count: { $sum: 1 } } },
      { $project: { ma_hoc_phan: '$_id', count: 1, _id: 0 } },
      { $sort: { ma_hoc_phan: 1 } }
    ]).exec();

    const subjects = await this.subjectModel.find().lean();
    const mapSub = new Map(subjects.map((s:any) => [s.ma_hoc_phan, s.ten_hoc_phan]));

    const configs = (typeof hocKy === 'number' && !isNaN(hocKy)) 
      ? await this.configModel.find({ hoc_ky: hocKy }).lean() 
      : await this.configModel.find().lean();
      
    const configMap = new Map(configs.map(c => [c.ma_hoc_phan, c]));

    return agg.map((r:any) => {
        const config = configMap.get(r.ma_hoc_phan);
        return {
            ma_hoc_phan: r.ma_hoc_phan,
            ten_hoc_phan: mapSub.get(r.ma_hoc_phan) || null,
            count: r.count,
            si_so_toi_da: config?.si_so_toi_da,
            si_so_toi_thieu: config?.si_so_toi_thieu,
        }
    });
  }

  async getRegistrationsBySubject(maHocPhan: string, hocKy?: number) {
    if (!maHocPhan) return [];
    const filter: any = { ma_hoc_phan: maHocPhan };
    if (typeof hocKy === 'number' && !isNaN(hocKy)) filter.hoc_ky = hocKy;
    const regs = await this.dangKyModel.find(filter).sort({ 'thoi_gian_dang_ky': 1 }).lean();

    const maSVs = regs.map(r => r.ma_sv);
    const users = await this.userModel.find({ ma_sv: { $in: maSVs } }).lean();
    const mapUser = new Map(users.map(u => [u.ma_sv, u.ho_ten]));
    return regs.map((r:any) => ({
      ...r,
      ho_ten: mapUser.get(r.ma_sv) || '(Không có tên)',
      thoi_gian_dang_ky: r.thoi_gian_dang_ky ? new Date(r.thoi_gian_dang_ky).toISOString() : null
    }));
  }

}
