import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LayoutServiceService {

  private baseUrl = 'https://localhost:44341/api/Host/space-layout-current?spaceId='; // Update with your API URL

  constructor(private http: HttpClient) {}

  getCurrentLayout(spaceId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}${spaceId}`);
  }
}
