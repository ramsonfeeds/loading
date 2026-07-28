import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, ElementRef, QueryList, ViewChildren, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, combineLatest, firstValueFrom, startWith, switchMap } from 'rxjs';
import { Factory, Product, ProductionItemSource, ProductionList, ProductionListPayload } from '../../core/models';
import { ProductService } from '../../core/product.service';
import { ProductionService } from '../../core/production.service';
import { apiDateToDate, dateToApiDate, formatDisplayDate, todayDate } from '../../shared/date-utils';
import { filterProductsForAutocomplete } from '../../shared/product-search';
import { PrintOptions, PrintOptionsDialogComponent } from '../../shared/print-options-dialog.component';

interface ProductionItemForm {
  productSearch: FormControl<string>;
  productId: FormControl<number | null>;
  quantity: FormControl<number | null>;
  sourceType: FormControl<ProductionItemSource>;
}

interface ProductionForm {
  productionDate: FormControl<Date | null>;
  title: FormControl<string>;
  factory: FormControl<Factory>;
  items: FormArray<FormGroup<ProductionItemForm>>;
}

@Component({
  selector: 'app-production',
  standalone: true,
  imports: [
    AsyncPipe,
    MatAutocompleteModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatSelectModule,
    MatSnackBarModule,
    NgFor,
    NgIf,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './production.component.html',
  styleUrl: './production.component.scss'
})
export class ProductionComponent {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly productionService = inject(ProductionService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly refresh$ = new BehaviorSubject<void>(undefined);

  @ViewChildren('quantityInput') private readonly quantityInputs?: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChildren(MatAutocompleteTrigger) private readonly autocompleteTriggers?: QueryList<MatAutocompleteTrigger>;

  readonly products$ = this.productService.list('', 'true');
  readonly selectedDate = this.fb.control(todayDate());
  readonly editing = signal<ProductionList | null>(null);
  readonly printFactories = signal<Factory[]>(['R', 'S']);

  readonly form = this.fb.nonNullable.group<ProductionForm>({
    productionDate: this.fb.control(todayDate(), Validators.required),
    title: this.fb.nonNullable.control('Manual Production'),
    factory: this.fb.nonNullable.control<Factory>('R'),
    items: this.fb.array<FormGroup<ProductionItemForm>>([])
  });

  readonly lists$ = combineLatest([
    this.selectedDate.valueChanges.pipe(startWith(this.selectedDate.value)),
    this.refresh$
  ]).pipe(
    switchMap(([date]) => this.productionService.list({ date: dateToApiDate(date) }))
  );

  constructor() {
    this.addItem();
  }

  get items(): FormArray<FormGroup<ProductionItemForm>> {
    return this.form.controls.items;
  }

  addItem(): void {
    this.items.push(this.fb.group<ProductionItemForm>({
      productSearch: this.fb.nonNullable.control(''),
      productId: this.fb.control(null, Validators.required),
      quantity: this.fb.control(null, [Validators.required, Validators.min(1)]),
      sourceType: this.fb.nonNullable.control<ProductionItemSource>('MANUAL')
    }));
  }

  removeItem(index: number): void {
    if (this.items.length === 1) {
      this.items.at(0).reset({ productSearch: '', productId: null, quantity: null, sourceType: 'MANUAL' });
      return;
    }
    this.items.removeAt(index);
  }

  edit(list: ProductionList): void {
    this.editing.set(list);
    this.form.controls.productionDate.setValue(apiDateToDate(list.productionDate));
    this.form.controls.title.setValue(list.title);
    this.form.controls.factory.setValue(list.factory);
    this.items.clear();
    list.items.forEach(item => {
      this.items.push(this.fb.group<ProductionItemForm>({
        productSearch: this.fb.nonNullable.control(item.product.tamilName),
        productId: this.fb.control(item.productId, Validators.required),
        quantity: this.fb.control(item.quantity, [Validators.required, Validators.min(1)]),
        sourceType: this.fb.nonNullable.control(item.sourceType)
      }));
    });
    if (this.items.length === 0) {
      this.addItem();
    }
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    const payload = this.payload();
    const editing = this.editing();
    this.productionService.save(payload, editing?.id).subscribe(() => {
      this.snackBar.open('Production saved', 'OK', { duration: 1600 });
      this.cancel();
      this.refresh$.next();
    });
  }

  delete(list: ProductionList): void {
    this.productionService.delete(list.id).subscribe(() => {
      this.snackBar.open('Production deleted', 'OK', { duration: 1600 });
      this.refresh$.next();
      if (this.editing()?.id === list.id) {
        this.cancel();
      }
    });
  }

  cancel(): void {
    this.editing.set(null);
    this.form.reset({ productionDate: this.selectedDate.value ?? todayDate(), title: 'Manual Production', factory: 'R' });
    this.items.clear();
    this.addItem();
  }

  async print(): Promise<void> {
    const options = await this.openPrintOptions();
    if (!options) {
      return;
    }

    this.printFactories.set(options.productionFactories);
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    window.print();
  }

  selectProduct(event: MatAutocompleteSelectedEvent, itemIndex: number): void {
    const product = event.option.value as Product;
    const item = this.items.at(itemIndex);
    item.patchValue({ productSearch: product.tamilName, productId: product.id });
    this.closeAllAutocompletePanels();
    this.focusQuantity(itemIndex);
  }

  productEnter(event: Event, itemIndex: number): void {
    event.preventDefault();
    this.closeAllAutocompletePanels();
    this.focusQuantity(itemIndex);
  }

  filteredProducts(products: readonly Product[], search: string): Product[] {
    return filterProductsForAutocomplete(products, search);
  }

  productName(products: readonly Product[], productId: number): string {
    const product = products.find(item => item.id === productId);
    return product?.tamilName ?? String(productId);
  }

  displayDate(date: string): string {
    return formatDisplayDate(date);
  }

  listTotal(list: ProductionList): number {
    return list.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  printLists(lists: readonly ProductionList[]): ProductionList[] {
    const factories = this.printFactories();
    return lists.filter(list => factories.includes(list.factory));
  }

  private payload(): ProductionListPayload {
    const value = this.form.getRawValue();
    const items: ProductionListPayload['items'] = value.items
      .map((item, sortOrder): ProductionListPayload['items'][number] | null => item.productId && item.quantity ? {
        productId: item.productId,
        quantity: item.quantity,
        sortOrder,
        sourceType: item.sourceType
      } : null)
      .filter((item): item is ProductionListPayload['items'][number] => item !== null);

    return {
      productionDate: dateToApiDate(value.productionDate),
      title: value.title,
      factory: value.factory,
      sourceDispatchId: this.editing()?.sourceDispatchId ?? null,
      items
    };
  }

  private focusQuantity(itemIndex: number): void {
    this.quantityInputs?.get(itemIndex)?.nativeElement.focus();
  }

  private closeAllAutocompletePanels(): void {
    this.autocompleteTriggers?.forEach(trigger => trigger.closePanel());
  }

  private openPrintOptions(): Promise<PrintOptions | undefined> {
    const dialogRef = this.dialog.open(PrintOptionsDialogComponent, {
      width: '360px',
      autoFocus: 'dialog',
      data: { mode: 'production' }
    });

    return firstValueFrom(dialogRef.afterClosed());
  }
}
