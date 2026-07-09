import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from './environment';
import { Product, ProductPayload } from './models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/products`;

  list(search = '', active: 'true' | 'false' | 'all' = 'all'): Observable<Product[]> {
    const params = new HttpParams().set('search', search).set('active', active);
    return this.http.get<Product[]>(this.baseUrl, { params });
  }

  create(payload: ProductPayload): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, payload);
  }

  update(id: number, payload: Partial<ProductPayload>): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
