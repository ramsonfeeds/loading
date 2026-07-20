import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from './environment';
import { Factory, ProductionList, ProductionListPayload } from './models';

export interface ProductionSearch {
  date?: string;
  factory?: Factory;
}

@Injectable({ providedIn: 'root' })
export class ProductionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/production`;

  list(search: ProductionSearch): Observable<ProductionList[]> {
    let params = new HttpParams();
    Object.entries(search).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value);
      }
    });
    return this.http.get<ProductionList[]>(this.baseUrl, { params });
  }

  save(payload: ProductionListPayload, id?: number): Observable<ProductionList> {
    if (id) {
      return this.http.put<ProductionList>(`${this.baseUrl}/${id}`, payload);
    }
    return this.http.post<ProductionList>(this.baseUrl, payload);
  }

  generate(date: string): Observable<ProductionList[]> {
    const params = new HttpParams().set('date', date);
    return this.http.post<ProductionList[]>(`${this.baseUrl}/generate`, null, { params });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
