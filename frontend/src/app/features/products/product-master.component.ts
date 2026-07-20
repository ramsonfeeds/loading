import { AsyncPipe, NgFor } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { debounceTime, startWith, switchMap } from 'rxjs';
import { Product, ProductPayload, ProductType } from '../../core/models';
import { ProductService } from '../../core/product.service';

@Component({
  selector: 'app-product-master',
  standalone: true,
  imports: [AsyncPipe, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, NgFor, ReactiveFormsModule, RouterLink],
  templateUrl: './product-master.component.html',
  styleUrl: './product-master.component.scss'
})
export class ProductMasterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);

  readonly editing = signal<Product | null>(null);
  readonly search = this.fb.nonNullable.control('');
  readonly form = this.fb.nonNullable.group({
    englishName: ['', Validators.required],
    tamilName: ['', Validators.required],
    weight: [49, [Validators.required, Validators.min(0.01)]],
    active: true,
    productType: this.fb.nonNullable.control<ProductType>('MANUFACTURED')
  });

  readonly products$ = this.search.valueChanges.pipe(
    startWith(''),
    debounceTime(150),
    switchMap(() => this.productService.list(this.search.value, 'all'))
  );

  edit(product: Product): void {
    this.editing.set(product);
    this.form.setValue({
      englishName: product.englishName,
      tamilName: product.tamilName,
      weight: Number(product.weight),
      active: product.active,
      productType: product.productType
    });
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }
    const payload: ProductPayload = this.form.getRawValue();
    const editing = this.editing();
    const request = editing ? this.productService.update(editing.id, payload) : this.productService.create(payload);
    request.subscribe(() => {
      this.cancel();
    });
  }

  delete(product: Product): void {
    this.productService.delete(product.id).subscribe();
  }

  cancel(): void {
    this.editing.set(null);
    this.form.reset({ englishName: '', tamilName: '', weight: 49, active: true, productType: 'MANUFACTURED' });
  }
}
