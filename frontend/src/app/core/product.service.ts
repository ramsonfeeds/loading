import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, map, shareReplay, switchMap, tap } from 'rxjs';
import { environment } from './environment';
import { Product, ProductPayload } from './models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/products`;
  private readonly refresh$ = new BehaviorSubject<void>(undefined);
  private readonly products$ = this.refresh$.pipe(
    switchMap(() => this.http.get<Product[]>(this.baseUrl)),
    shareReplay(1)
  );

  list(search = '', active: 'true' | 'false' | 'all' = 'all'): Observable<Product[]> {
    return this.products$.pipe(
      map(products => this.filterProducts(products, search, active))
    );
  }

  create(payload: ProductPayload): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, payload).pipe(
      tap(() => this.refresh$.next())
    );
  }

  update(id: number, payload: Partial<ProductPayload>): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/${id}`, payload).pipe(
      tap(() => this.refresh$.next())
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.refresh$.next())
    );
  }

  private filterProducts(products: Product[], search: string, active: 'true' | 'false' | 'all'): Product[] {
    const normalizedSearch = search.trim().toLowerCase();

    return products.filter(product => {
      const matchesActive = active === 'all' || product.active === (active === 'true');
      const matchesSearch =
        !normalizedSearch ||
        product.englishName.toLowerCase().includes(normalizedSearch) ||
        product.tamilName.toLowerCase().includes(normalizedSearch);

      return matchesActive && matchesSearch;
    });
  }
}
