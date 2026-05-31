import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule, DatePipe } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { ThoiKhoaBieuService } from '../../../core/services/thoi-khoa-bieu.service';
import { AuthService } from '../../../core/services/auth.service'; 

interface ScheduleItem {
  ten_hp: string;
  ma_lop_hp: string;
  ma_ghep: string;
  tiet_bat_dau: number;
  tiet_ket_thuc: number;
  phong: string;
  ten_gv: string;
  trang_thai: string; 
  loai_phong: 'theory' | 'lab' | 'online' | 'exam' | 'off'; 
}

interface WeeklySchedule {
  [key: string]: { 
    'Sáng': ScheduleItem[];
    'Chiều': ScheduleItem[];
    'Tối': ScheduleItem[];
  };
}

@Component({
  selector: 'app-student-timetable',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe], 
  templateUrl: './student-timetable.component.html',
  styleUrls: ['./student-timetable.component.css']
})
export class StudentTimetableComponent implements OnInit {
  
  maSinhVien: string | null = null; 
  hocKyHienTai = 1; 

  isLoading = true;
  errorMessage = '';

  currentDate: Date = new Date(); 
  weekDays: Date[] = [];
  
  weeklySchedule: WeeklySchedule = {};

  sessions = [
    { name: 'Sáng', start: 1, end: 6 },
    { name: 'Chiều', start: 7, end: 12 },
    { name: 'Tối', start: 13, end: 15 },
  ];
  
  dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  
  constructor(
    private tkbService: ThoiKhoaBieuService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.maSinhVien = this.authService.getUserMaSV();
    
    if (!this.maSinhVien) {
        this.errorMessage = 'Không tìm thấy Mã Sinh viên. Vui lòng đăng nhập lại.';
        this.isLoading = false;
        return;
    }
    
    this.currentDate = this.getStartOfWeek(new Date()); 
    this.calculateWeekDays();
    this.loadStudentSchedule();
  }
  
  getStartOfWeek(date: Date): Date {
    const day = date.getDay(); 
    const diff = date.getDate() - (day === 0 ? 6 : day - 1); 
    
    const startOfWeek = new Date(date); 
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0); 
    return startOfWeek;
  }
  
  calculateWeekDays() {
    this.weekDays = [];
    let currentDay = new Date(this.currentDate);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentDay);
      this.weekDays.push(day);
      currentDay.setDate(currentDay.getDate() + 1);
    }

  }

  changeWeek(offset: number) {
    const newDate = new Date(this.currentDate);
    newDate.setDate(newDate.getDate() + offset);
    
    this.currentDate = this.getStartOfWeek(newDate); 
    this.calculateWeekDays();
    this.loadStudentSchedule();
  }
    onDateChange(dateString: string) {
        if (!dateString) return;
                const selectedDate = new Date(dateString);
                if (!isNaN(selectedDate.getTime())) {       
                    this.currentDate = this.getStartOfWeek(selectedDate);                       
                    this.calculateWeekDays();      
                    this.loadStudentSchedule();
        }
    }
  

  extractTietNumber(tietStr: string): number {
    if (!tietStr) return 0;
    const match = tietStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }


  loadStudentSchedule() {
    if (!this.maSinhVien) {
        this.errorMessage = 'Không tìm thấy Mã Sinh viên.';
        this.isLoading = false;
        this.cdr.detectChanges();
        return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    this.weeklySchedule = {};
    
    this.tkbService.getForStudent(this.maSinhVien, this.hocKyHienTai).subscribe({
      next: (res: any) => {
        const scheduleData = res.data || [];
        this.processScheduleData(scheduleData);
        this.isLoading = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Lỗi tải lịch:', err);
        this.errorMessage = 'Không thể tải lịch học. Vui lòng kiểm tra kết nối API.';
        this.isLoading = false;
        this.cdr.detectChanges(); 
      }
    });
  }

    /**
     * Xác định loại học (Theory/Lab) dựa trên tiết bắt đầu và kết thúc.
     * @param startTiết
     * @param endTiết
     * @returns
     */
    determineClassTypeByTiet(startTiet: number, endTiet: number): 'theory' | 'lab' {
        const totalTiets = endTiet - startTiet + 1; 
        if (totalTiets === 3) {
            return 'theory';
        }
        if (totalTiets === 5) {
            return 'lab';
        }
        return 'theory';
    }

    processScheduleData(rawData: any[]) {
        const newWeeklySchedule: WeeklySchedule = {};
        
        this.dayNames.forEach(dayName => {
            newWeeklySchedule[dayName] = { 'Sáng': [], 'Chiều': [], 'Tối': [] };
        });
        
        const weekStart = this.weekDays[0].getTime();
        const weekEnd = new Date(this.weekDays[6]);
        weekEnd.setHours(23, 59, 59, 999); 
        const weekEndTime = weekEnd.getTime() - 1; 

        rawData.forEach(lopHp => {
            
            const tietBatDau = this.extractTietNumber(lopHp.ca_dau);
            const tietKetThuc = this.extractTietNumber(lopHp.ca_cuoi);
            
            let loaiPhongCuaLop: 'theory' | 'lab' = this.determineClassTypeByTiet(tietBatDau, tietKetThuc);
            
            const phongHoc = lopHp.phong || '';
            const lowerRoom = phongHoc.toLowerCase();
            let loaiPhong: 'theory' | 'lab' | 'online' | 'exam' | 'off' = loaiPhongCuaLop;
            
            if (lowerRoom.includes('zoom') || lowerRoom.includes('online') || lowerRoom.includes('trực tuyến')) {
                loaiPhong = 'online';
            }
            
            if (!lopHp.chi_tiet_buoi_hoc) return; 
            
            lopHp.chi_tiet_buoi_hoc
            .filter((buoi: any) => {
                if (!buoi.ngay_hoc) return false;
                
                const ngayHocStr = buoi.ngay_hoc.substring(0, 10); 
                const ngayHoc = new Date(ngayHocStr); 
                ngayHoc.setHours(0, 0, 0, 0); 
                const ngayHocTime = ngayHoc.getTime();

                return ngayHocTime >= weekStart && ngayHocTime <= weekEndTime; 
            })
            .forEach((buoi: any) => {
                const ngayHocStr = buoi.ngay_hoc.substring(0, 10);
                const ngayHoc = new Date(ngayHocStr);
                const dayIndex = ngayHoc.getDay(); 
                const dayName = this.dayNames[dayIndex];
                
                const sessionName = this.determineSession(tietBatDau);
                
                const isExam = buoi.trang_thai === 'Lịch thi';
                
                let tenGV = 'N/A';
                if (lopHp.ten_giang_vien) {
                    tenGV = lopHp.ten_giang_vien;
                } else if (lopHp.giang_vien && typeof lopHp.giang_vien === 'object' && lopHp.giang_vien.ho_ten) {
                    tenGV = lopHp.giang_vien.ho_ten;
                } else if (lopHp.ma_gv) {
                    tenGV = lopHp.ma_gv;
                }

                const scheduleItem: ScheduleItem = {
                    ten_hp: lopHp.ten_hoc_phan,
                    ma_lop_hp: lopHp.ma_lop_hp,
                    ma_ghep: lopHp.ma_ghep || '', 
                    tiet_bat_dau: tietBatDau,
                    tiet_ket_thuc: tietKetThuc, 
                    phong: phongHoc,
                    ten_gv: tenGV, 
                    trang_thai: buoi.trang_thai,
                    loai_phong: isExam ? 'exam' : (buoi.trang_thai === 'Nghỉ' ? 'off' : loaiPhong)
                };
                
                if (newWeeklySchedule[dayName] && newWeeklySchedule[dayName][sessionName as keyof WeeklySchedule['T2']]) {
                    newWeeklySchedule[dayName][sessionName as keyof WeeklySchedule['T2']].push(scheduleItem);
                }
            });
        });
        
        Object.values(newWeeklySchedule).forEach(day => {
            (day['Sáng'] || []).sort((a, b) => a.tiet_bat_dau - b.tiet_bat_dau);
            (day['Chiều'] || []).sort((a, b) => a.tiet_bat_dau - b.tiet_bat_dau);
            (day['Tối'] || []).sort((a, b) => a.tiet_bat_dau - b.tiet_bat_dau);
        });

        this.weeklySchedule = newWeeklySchedule;
    }
  
  determineSession(startTiết: number): string {
    if (startTiết >= 1 && startTiết <= 6) return 'Sáng';
    if (startTiết >= 7 && startTiết <= 12) return 'Chiều';
    if (startTiết >= 13) return 'Tối';
    return '';
  }

  determineClassType(roomName: string): 'theory' | 'lab' | 'online' | 'exam' | 'off' {
    if (!roomName) {
        return 'theory'; 
    }
    const lowerRoom = roomName.toLowerCase();
    if (lowerRoom.includes('lab') || lowerRoom.includes('th')) return 'lab';
    if (lowerRoom.includes('zoom') || lowerRoom.includes('online') || lowerRoom.includes('trực tuyến')) return 'online';
    return 'theory'; 
  }
  
  getScheduleByDayAndSession(dayName: string, sessionName: string): ScheduleItem[] {
    const daySchedule = this.weeklySchedule[dayName];
    if (daySchedule) {
      return daySchedule[sessionName as keyof WeeklySchedule['T2']] || [];
    }
    return [];
  }
}