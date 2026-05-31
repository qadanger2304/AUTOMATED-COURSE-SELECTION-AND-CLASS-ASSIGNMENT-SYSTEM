import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'
import { AuthService } from '../../../core/services/auth.service';
import { ThoiKhoaBieuService } from '../../../core/services/thoi-khoa-bieu.service';
import { catchError, map, of } from 'rxjs';

interface ClassSummary {
  ma_lop_hp: string;
  ten_hp: string;
  so_sv: number;
  phong: string;
  trang_thai: 'Ổn định' | 'Cần chú ý' | 'Lớp đông';
}

@Component({
  selector: 'app-advisor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './advisor-dashboard.component.html',
  styleUrls: ['./advisor-dashboard.component.css']
})
export class AdvisorDashboardComponent implements OnInit {
  
  tenGiangVien: string = 'Giảng viên';
  maGiangVien: string | null = null;
  
  hocKyOptions: number[] = [1, 2, 3, 4, 5, 6, 7, 8];
  selectedHocKy: number = 1;

  stats = {
    totalStudents: 0,
    totalSubjects: 0,
    totalClasses: 0,
    problemClasses: 0
  };

  classesList: ClassSummary[] = [];
  isLoading = true;

  constructor(
    private authService: AuthService,
    private tkbService: ThoiKhoaBieuService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.maGiangVien = this.authService.getUserMaGV();
    this.tenGiangVien = this.authService.getUserName() || 'Quý Thầy/Cô';

    if (this.maGiangVien) {
      this.loadDashboardData(this.maGiangVien, this.selectedHocKy);
    } else {
      this.isLoading = false;
    }
  }

  onHocKyChange() {
    if (this.maGiangVien) {
      this.loadDashboardData(this.maGiangVien, this.selectedHocKy);
    }
  }

  loadDashboardData(maGV: string, hocKy: number) {
    this.isLoading = true;
    
    this.stats = { totalStudents: 0, totalSubjects: 0, totalClasses: 0, problemClasses: 0 };
    this.classesList = [];

    this.tkbService.getForLecturer(maGV, hocKy).pipe(
      catchError(err => {
        console.error('Lỗi tải dashboard:', err);
        this.cdr.detectChanges();
        return of({ data: [] });
      }),
      map((res: any) => {
        const rawData = res.data || [];
        
        const uniqueClassesMap = new Map<string, any>();

        rawData.forEach((item: any) => {
          if (item.ma_lop_hp && !uniqueClassesMap.has(item.ma_lop_hp)) {
            uniqueClassesMap.set(item.ma_lop_hp, item);
          }
        });

        const uniqueClasses = Array.from(uniqueClassesMap.values());

        let studentCount = 0;
        const uniqueSubjects = new Set<string>();
        let problemCount = 0;

        const processedList: ClassSummary[] = uniqueClasses.map((lop: any) => {
          const soLuongSV = Array.isArray(lop.danh_sach_sv) ? lop.danh_sach_sv.length : 0;
          const tenHP = lop.ten_hoc_phan || lop.ten_hp || 'Không tên';
          
          studentCount += soLuongSV;
          if (lop.ma_hoc_phan) uniqueSubjects.add(lop.ma_hoc_phan);

          let status: 'Ổn định' | 'Cần chú ý' | 'Lớp đông' = 'Ổn định';
          if (soLuongSV < 7) {
            status = 'Cần chú ý';
            problemCount++;
          } else if (soLuongSV > 40) {
            status = 'Lớp đông';
          }

          return {
            ma_lop_hp: lop.ma_lop_hp,
            ten_hp: tenHP,
            so_sv: soLuongSV,
            phong: lop.phong || 'Chưa xếp',
            trang_thai: status
          };
        });

        return {
          stats: {
            totalStudents: studentCount,
            totalSubjects: uniqueSubjects.size,
            totalClasses: uniqueClasses.length,
            problemClasses: problemCount
          },
          list: processedList
        };
      })
    ).subscribe(result => {
      this.stats = result.stats;
      this.classesList = result.list;
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }
}