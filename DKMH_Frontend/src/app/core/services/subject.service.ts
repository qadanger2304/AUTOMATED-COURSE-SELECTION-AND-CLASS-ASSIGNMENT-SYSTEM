import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SubjectService {
  private apiUrl = 'http://localhost:3000/api/subjects';

  public cachedSubjects: any[] | null = null;

  constructor(private http: HttpClient) {}

  getAllSubjects(): Observable<any[]> {
    if (this.cachedSubjects) {
      return new Observable(observer => {
        observer.next(this.cachedSubjects!);
        observer.complete();
      });
    }

    return this.http.get<any>(this.apiUrl).pipe(
      map(res => res.data ?? res),
      tap((subjects: any[]) => this.cachedSubjects = subjects)
    );
  }

  getElectives(): Observable<any[]> {
    return this.getAllSubjects().pipe(
      map((subjects: any[]) =>
        subjects.filter((s: any) => s.loai?.toLowerCase().includes('tự chọn'))
      )
    );
  }

  createSubject(data: any, maNganh: string, maChuyenNganh: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}?maNganh=${maNganh}&maChuyenNganh=${maChuyenNganh}`, data).pipe(
      tap(() => this.cachedSubjects = null)
    );
  }

  updateSubject(maHocPhan: string, subjectData: any) {
    return this.http.put(`${this.apiUrl}/by-code/${maHocPhan}`, subjectData).pipe(
      tap(() => this.cachedSubjects = null)
    );
  }


  deleteSubject(maHocPhan: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${maHocPhan}`).pipe(
      tap(() => this.cachedSubjects = null)
    );
  }

  getElectivesBySemester(hocKy: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/electives/${hocKy}`);
  }
}
