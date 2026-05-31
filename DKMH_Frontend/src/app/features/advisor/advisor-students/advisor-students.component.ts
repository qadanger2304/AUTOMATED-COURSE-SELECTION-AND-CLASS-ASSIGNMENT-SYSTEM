import { Component, OnInit, ChangeDetectorRef  } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { ThoiKhoaBieuService } from '../../../core/services/thoi-khoa-bieu.service';
import { forkJoin, map, of, catchError } from 'rxjs';

export interface StudentDisplayData {
  _id: string;
  ma_sv: string;
  ho_ten: string;
  email: string;
  ngay_sinh: any;
  lop: string;
  nganh: string;
  trang_thai_hoc_tap: string;
  associated_ma_lop_hp: string[];
}

@Component({
  selector: 'app-advisor-students',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './advisor-students.component.html',
  styleUrls: ['./advisor-students.component.css']
})
export class AdvisorStudentsComponent implements OnInit {
  maGiangVien: string | null = null;
  tenGiangVien: string = 'Giảng viên';

  classOptions: string[] = []; 
  allStudents: StudentDisplayData[] = []; 
  filteredStudents: StudentDisplayData[] = [];

  isLoading: boolean = true;
  errorMessage: string | null = null;

  selectedClass: string = 'Tất cả lớp';
  searchQuery: string = '';
  
  showStudentModal: boolean = false;
  selectedStudent: StudentDisplayData | null = null;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private tkbService: ThoiKhoaBieuService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.maGiangVien = this.authService.getUserMaGV();
    this.tenGiangVien = this.authService.getUserName() || 'Giảng viên';
    
    if (this.maGiangVien) {
      this.loadData(this.maGiangVien);
    } else {
      this.errorMessage = 'Không tìm thấy thông tin Giảng Viên. Vui lòng đăng nhập lại.';
      this.isLoading = false;
    }
  }

  loadData(maGV: string): void {
    this.isLoading = true;
    this.errorMessage = null;

    forkJoin({
      tkbData: this.tkbService.getForLecturer(maGV, 1).pipe(
        catchError(err => {
          console.error('Lỗi lấy TKB:', err);
          return of({ data: [] });
        })
      ),
      allUsers: this.userService.getAllUsers().pipe(
        catchError(err => {
          console.error('Lỗi lấy danh sách User:', err);
          return of({ data: [] });
        })
      )
    }).subscribe({
      next: (res: any) => {
        const tkbList = res.tkbData?.data || [];
        const usersList = res.allUsers?.data || [];

        if (tkbList.length === 0) {
          this.isLoading = false;
          this.errorMessage = 'Chưa có lịch dạy nào được phân công.';
          return;
        }

        const uniqueClassesSet = new Set<string>();
        const studentLhpMap = new Map<string, string[]>();

        tkbList.forEach((lop: any) => {
          const maLopHP = lop.ma_lop_hp;
          if (maLopHP) uniqueClassesSet.add(maLopHP);

          if (lop.danh_sach_sv && Array.isArray(lop.danh_sach_sv)) {
            lop.danh_sach_sv.forEach((mssv: string) => {
              if (!mssv) return;
              
              const currentClasses = studentLhpMap.get(mssv) || [];
              if (!currentClasses.includes(maLopHP)) {
                currentClasses.push(maLopHP);
              }
              studentLhpMap.set(mssv, currentClasses);
            });
          }
        });

        this.classOptions = ['Tất cả lớp', ...Array.from(uniqueClassesSet)];

        const validStudents: StudentDisplayData[] = [];

        usersList.forEach((u: any) => {
          if (u.ma_sv && studentLhpMap.has(u.ma_sv)) {
            validStudents.push({
              _id: u._id,
              ma_sv: u.ma_sv,
              ho_ten: u.ho_ten || 'Chưa cập nhật tên',
              email: u.email || '-',
              ngay_sinh: u.ngay_sinh,
              lop: u.lop || 'Chưa cập nhật',
              nganh: u.nganh || u.nganh_hoc || 'Chưa cập nhật',
              trang_thai_hoc_tap: u.trang_thai || 'Đang học',
              associated_ma_lop_hp: studentLhpMap.get(u.ma_sv) || [] 
            });
          }
        });

        this.allStudents = validStudents;
        this.filteredStudents = validStudents;
        this.isLoading = false;
        this.cdr.detectChanges();
        this.applyFilters();
      },
      error: (err) => {
        console.error('Lỗi tải dữ liệu Advisor Students:', err);
        this.errorMessage = 'Có lỗi xảy ra khi tải dữ liệu.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }


  applyFilters(): void {
    let temp = [...this.allStudents];

    if (this.selectedClass !== 'Tất cả lớp') {
      temp = temp.filter(s => s.associated_ma_lop_hp.includes(this.selectedClass));
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      temp = temp.filter(s => 
        (s.ho_ten && s.ho_ten.toLowerCase().includes(query)) || 
        (s.ma_sv && s.ma_sv.toLowerCase().includes(query))
      );
    }

    this.filteredStudents = temp;
    this.cdr.detectChanges();
  }

  onClassChange(newVal: string): void {
    this.selectedClass = newVal;
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }
  
  onSearchClick(): void {
    this.applyFilters();
  }

  viewStudentDetail(student: StudentDisplayData): void {
    this.selectedStudent = student;
    this.showStudentModal = true;
  }

  closeModal(): void {
    this.showStudentModal = false;
    this.selectedStudent = null;
  }
}