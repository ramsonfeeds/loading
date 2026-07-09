import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from './environment';
import { Dispatch, DispatchPayload } from './models';

export interface DispatchSearch {
  date?: string;
  title?: string;
  product?: string;
}

@Injectable({ providedIn: 'root' })
export class DispatchService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dispatches`;

  list(search: DispatchSearch): Observable<Dispatch[]> {
    let params = new HttpParams();
    Object.entries(search).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value);
      }
    });
    return this.http.get<Dispatch[]>(this.baseUrl, { params });
  }

  get(id: number): Observable<Dispatch> {
    return this.http.get<Dispatch>(`${this.baseUrl}/${id}`);
  }

  save(payload: DispatchPayload, id?: number): Observable<Dispatch> {
    if (id) {
      return this.http.put<Dispatch>(`${this.baseUrl}/${id}`, payload);
    }
    return this.http.post<Dispatch>(this.baseUrl, payload);
  }

  duplicate(id: number): Observable<Dispatch> {
    return this.http.post<Dispatch>(`${this.baseUrl}/${id}/duplicate`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
