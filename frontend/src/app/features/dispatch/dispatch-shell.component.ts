import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, Subject, combineLatest, concatMap, debounceTime, distinctUntilChanged, finalize, firstValueFrom, map, of, startWith, switchMap, takeUntil, tap } from 'rxjs';
import { Dispatch, DispatchAllocationPayload, DispatchGroup, DispatchGroupPayload, DispatchItemPayload, DispatchPayload, Factory, Product } from '../../core/models';
import { DispatchService } from '../../core/dispatch.service';
import { ProductService } from '../../core/product.service';
import { ProductionService } from '../../core/production.service';
import { apiDateToDate, dateToApiDate, todayDate } from '../../shared/date-utils';
import { grandTotal, groupTotal, totalWeight, weightLines } from '../../shared/dispatch-totals';
import { DispatchSearchComponent } from './dispatch-search.component';
import { PrintReceiptComponent } from './print-receipt.component';
import { AllocationDialogComponent } from './allocation-dialog.component';

interface ItemForm {
  productSearch: FormControl<string>;
  productId: FormControl<number | null>;
  quantity: FormControl<number | null>;
  description: FormControl<string>;
  allocations: FormControl<DispatchAllocationPayload[]>;
}

interface GroupForm {
  items: FormArray<FormGroup<ItemForm>>;
}

interface DispatchForm {
  dispatchDate: FormControl<Date | null>;
  title: FormControl<string>;
  factory: FormControl<Factory>;
  groups: FormArray<FormGroup<GroupForm>>;
}

@Component({
  selector: 'app-dispatch-shell',
  standalone: true,
  imports: [
    AsyncPipe,
    DragDropModule,
    DispatchSearchComponent,
    MatAutocompleteModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSnackBarModule,
    NgFor,
    NgIf,
    PrintReceiptComponent,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './dispatch-shell.component.html',
  styleUrl: './dispatch-shell.component.scss'
})
export class DispatchShellComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly dispatchService = inject(DispatchService);
  private readonly productionService = inject(ProductionService);
  private loadingDispatch = false;
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  @ViewChildren('productInput') private readonly productInputs?: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChildren('quantityInput') private readonly quantityInputs?: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChildren(MatAutocompleteTrigger) private readonly autocompleteTriggers?: QueryList<MatAutocompleteTrigger>;
  @ViewChild(PrintReceiptComponent) private readonly receipt?: PrintReceiptComponent;
  @ViewChild(DispatchSearchComponent) private readonly dispatchSearch?: DispatchSearchComponent;

  readonly products$ = this.productService.list('', 'true');
  readonly selectedDispatch = signal<Dispatch | null>(null);
  private activeRow: { groupIndex: number; itemIndex: number } | null = null;
  readonly saving = signal(false);
  readonly lastSavedAt = signal<Date | null>(null);
  readonly dirty = signal(false);
  readonly statusText = computed(() => {
    if (this.saving()) {
        return 'Saving...';
    }

    if (this.dirty()) {
        return '● Unsaved changes';
    }

    const saved = this.lastSavedAt();

    return saved
        ? `✓ Saved ${saved.toLocaleTimeString()}`
        : 'Not saved';
  });

  private hasIncompleteRows(): boolean {
    return this.groups.controls.some(group =>
      group.controls.items.controls.some(item => {
        const value = item.getRawValue();

        const hasAnyInput =
          !!value.productSearch.trim() ||
          value.productId !== null ||
          value.quantity !== null;

        const complete =
          value.productId !== null &&
          value.quantity !== null &&
          value.quantity > 0;

        return hasAnyInput && !complete;
      })
    );
  }

  readonly form = this.fb.nonNullable.group<DispatchForm>({
    dispatchDate: this.fb.control(todayDate(), Validators.required),
    title: this.fb.nonNullable.control(''),
    factory: this.fb.nonNullable.control<Factory>('R'),
    groups: this.fb.array<FormGroup<GroupForm>>([])
  });

  readonly productSearch$ = new BehaviorSubject<string>('');
  readonly filteredProducts$ = combineLatest([
    this.products$,
    this.productSearch$.pipe(startWith(''), debounceTime(80), distinctUntilChanged())
  ]).pipe(
    map(([products, search]) => {
      const normalized = search.trim().toLowerCase();
      return products.filter(product => {
        if (!normalized) {
          return true;
        }
        return product.englishName.toLowerCase().includes(normalized) || product.tamilName.toLowerCase().includes(normalized);
      }).slice(0, 20);
    })
  );

  ngOnInit(): void {
  this.addGroup();

  this.form.valueChanges
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      if (!this.loadingDispatch) {
        this.dirty.set(true);
      }
    });
}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get groups(): FormArray<FormGroup<GroupForm>> {
    return this.form.controls.groups;
  }

  groupTotalAt(index: number): number {
    return groupTotal(this.groupPayload(index));
  }

  grandTotal(): number {
    return grandTotal(this.payload().groups);
  }

  displayDispatchGroups(products: readonly Product[]): DispatchGroup[] {
    const lookup = new Map(products.map(product => [product.id, product]));
    return this.payload().groups.map(group => ({
        sortOrder: group.sortOrder,
        items: group.items
            .map(item => {
                const product = lookup.get(item.productId);

                return product
                    ? {
                        ...item,
                        product,
                        allocations: item.allocations ?? []
                    }
                    : null;
            })
            .filter((item): item is DispatchGroup['items'][number] => item !== null)
    }));
  }

  weightSummary(products: readonly Product[]) {
    const groups = this.displayDispatchGroups(products);
    const lines = weightLines(groups, products);
    return { lines, total: totalWeight(lines) };
  }

  addGroup(focus = true): void {
    this.groups.push(
        this.fb.group<GroupForm>({
            items: this.fb.array<FormGroup<ItemForm>>([])
        })
    );
    this.addItem(this.groups.length - 1, focus);
  }

  addItem(groupIndex: number, focus = true): void {
    this.groups.at(groupIndex).controls.items.push(this.createItemForm());

    this.productSearch$.next('');
    this.closeAllAutocompletePanels();
    this.reindex();

    if (!focus) return;

    setTimeout(() => {
      const itemIndex =
        this.groups.at(groupIndex).controls.items.length - 1;

      this.focusProduct(groupIndex, itemIndex);

      this.autocompleteTriggers
        ?.get(this.getFlatIndex(groupIndex, itemIndex))
        ?.openPanel();
    });
  }

  removeItem(groupIndex: number, itemIndex: number): void {
    const items = this.groups.at(groupIndex).controls.items;
    if (items.length === 1 && this.groups.length === 1) {
      items.at(0).reset({ productSearch: '', productId: null, quantity: null, description: '', allocations: [] });
      return;
    }
    items.removeAt(itemIndex);
    if (items.length === 0) {
      this.groups.removeAt(groupIndex);
    }
    this.reindex();
  }

  moveGroup(index: number, direction: -1 | 1): void {
    const next = index + direction;
    if (next < 0 || next >= this.groups.length) {
      return;
    }
    const current = this.groups.at(index);
    this.groups.removeAt(index);
    this.groups.insert(next, current);
    this.reindex();
  }

  dropGroup(event: CdkDragDrop<FormGroup<GroupForm>[]>): void {
    moveItemInArray(this.groups.controls, event.previousIndex, event.currentIndex);
    this.groups.updateValueAndValidity();
    this.reindex();
  }

  selectProduct(event: MatAutocompleteSelectedEvent, groupIndex: number, itemIndex: number): void {
    const product = event.option.value as Product;
    const item = this.groups.at(groupIndex).controls.items.at(itemIndex);
    item.patchValue({ productSearch: product.tamilName, productId: product.id });
    this.closeAllAutocompletePanels();
    this.focusQuantity(groupIndex, itemIndex);
  }

  productInputChanged(value: string): void {
    this.productSearch$.next(value);
  }

  productEnter(event: Event, groupIndex: number, itemIndex: number): void {
    event.preventDefault();
    this.closeAllAutocompletePanels();
    this.focusQuantity(groupIndex, itemIndex);
  }

  quantityEnter(event: KeyboardEvent, groupIndex: number, itemIndex: number): void {
    event.preventDefault();

    this.closeAllAutocompletePanels();

    const items = this.groups.at(groupIndex).controls.items;

    if (itemIndex === items.length - 1) {

      this.addItem(groupIndex, false);

      setTimeout(() => {
        const newIndex = this.groups.at(groupIndex).controls.items.length - 1;

        this.focusProduct(groupIndex, newIndex);

        const flatIndex = this.getFlatIndex(groupIndex, newIndex);

        this.autocompleteTriggers?.get(flatIndex)?.openPanel();
      });

      return;
    }

    this.focusProduct(groupIndex, itemIndex + 1);
  }

  shiftPrevious(groupIndex: number, itemIndex: number): void {
    if (itemIndex > 0) {
      this.focusProduct(groupIndex, itemIndex - 1);
      return;
    }
    if (groupIndex > 0) {
      const previousItems = this.groups.at(groupIndex - 1).controls.items;
      this.focusProduct(groupIndex - 1, previousItems.length - 1);
    }
  }

  newDispatch(): void {
    this.selectedDispatch.set(null);
    this.form.reset({ dispatchDate: todayDate(), title: '', factory: 'R' });
    this.groups.clear();
    this.addGroup();
    this.lastSavedAt.set(null);
    this.dirty.set(false);
  }

  loadDispatch(dispatch: Dispatch): void {
    this.loadingDispatch = true;

    this.selectedDispatch.set(dispatch);

    this.form.controls.dispatchDate.setValue(apiDateToDate(dispatch.dispatchDate));
    this.form.controls.title.setValue(dispatch.title);
    this.form.controls.factory.setValue(dispatch.factory, {
    emitEvent: false
});

    this.groups.clear();

    dispatch.groups.forEach(group => {
      const groupForm = this.fb.group<GroupForm>({
        items: this.fb.array<FormGroup<ItemForm>>([])
      });

      group.items.forEach(item => {
        groupForm.controls.items.push(
          this.createItemForm({
            productSearch: item.product.tamilName,
            productId: item.productId,
            quantity: item.quantity,
            description: item.description ?? '',
            allocations: item.allocations ?? []
          })
        );
      });

      this.groups.push(groupForm);
    });

    this.reindex();

    this.lastSavedAt.set(new Date(dispatch.updatedAt));
    this.dirty.set(false);

    this.loadingDispatch = false;
  }

  duplicate(dispatch: Dispatch): void {
    this.dispatchService.duplicate(dispatch.id).subscribe(copy => {
      this.loadDispatch(copy);
      this.snackBar.open('Dispatch duplicated', 'OK', { duration: 1800 });
    });
  }

  delete(dispatch: Dispatch): void {
    this.dispatchService.delete(dispatch.id).subscribe(() => {
      this.newDispatch();
      this.snackBar.open('Dispatch deleted', 'OK', { duration: 1800 });
    });
  }

  async saveNow(): Promise<boolean> {

    if (this.saving()) {
        return false;
    }

    const result = await firstValueFrom(this.persist(false));

    return result !== null;
  }

  async print(): Promise<void> {
    if (this.saving()) {
      return;
    }
      if (this.dirty()) {
        const saved = await this.saveNow();
        if (!saved) {
            return;
        }
      }
    this.snackBar.dismiss();
    this.receipt?.prepareScale();
    window.print();
  }

  async generateProduction(): Promise<void> {
    if (this.saving()) {
      return;
    }
    if (this.dirty()) {
      const saved = await this.saveNow();
      if (!saved) {
        return;
      }
    }

    const productionDate = dateToApiDate(this.form.controls.dispatchDate.value);
    if (!this.selectedDispatch()?.id) {
      this.snackBar.open('Save dispatch before generating production', 'OK', { duration: 2200 });
      return;
    }

    this.productionService.generate(productionDate).subscribe(lists => {
      this.snackBar.open(`Generated ${lists.length} production list${lists.length === 1 ? '' : 's'}`, 'OK', { duration: 2200 });
    });
  }

  @HostListener('document:keydown', ['$event'])
  handleShortcuts(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.saveNow();
    }
    if (event.ctrlKey && event.key.toLowerCase() === 'p') {
      event.preventDefault();
      void this.print();
    }
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      this.addGroup();
    }
    if (event.altKey && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      const row = this.activeRow;
      if (row) {
        this.openAllocation(row.groupIndex, row.itemIndex);
      }
    }
  }

  focusProduct(groupIndex: number, itemIndex: number): void {
    this.rememberRow(groupIndex, itemIndex);
    this.focusByFlatIndex(this.productInputs, groupIndex, itemIndex);
  }

  rememberRow(groupIndex: number, itemIndex: number): void {
    this.activeRow = { groupIndex, itemIndex };
  }

  hasAllocation(groupIndex: number, itemIndex: number): boolean {
    return this.groups.at(groupIndex).controls.items.at(itemIndex).controls.allocations.value.length > 0;
  }

  openAllocation(groupIndex: number, itemIndex: number): void {
    const item = this.groups.at(groupIndex).controls.items.at(itemIndex);
    const value = item.getRawValue();
    if (!value.quantity || value.quantity <= 0) {
      this.snackBar.open('Enter quantity before allocating.', 'OK', { duration: 2200 });
      return;
    }

    const dialogRef = this.dialog.open(AllocationDialogComponent, {
      width: '460px',
      data: {
        productName: value.productSearch || 'Product',
        quantity: value.quantity,
        allocations: value.allocations
      }
    });

    dialogRef.afterClosed().subscribe((allocations: DispatchAllocationPayload[] | undefined) => {
      if (allocations === undefined) {
        return;
      }
      item.controls.allocations.setValue(allocations);
      item.markAsDirty();
      this.reindex();
    });
  }

  private createItemForm(value?: Partial<{ productSearch: string; productId: number | null; quantity: number | null; description: string; allocations: DispatchAllocationPayload[] }>): FormGroup<ItemForm> {
    return this.fb.group<ItemForm>({
      productSearch: this.fb.nonNullable.control(value?.productSearch ?? ''),
      productId: this.fb.control(value?.productId ?? null),
      quantity: this.fb.control(value?.quantity ?? null, Validators.min(1)),
      description: this.fb.nonNullable.control(value?.description ?? ''),
      allocations: this.fb.nonNullable.control(value?.allocations ?? [])
    });
  }

  private getFlatIndex(groupIndex: number, itemIndex: number): number {
    return this.groups.controls
      .slice(0, groupIndex)
      .reduce((sum, g) => sum + g.controls.items.length, 0) + itemIndex;
  }

  private groupPayload(index: number): DispatchGroupPayload {
      return this.payload().groups[index] ?? {
          sortOrder: index,
          items: []
      };
  }

  private payload(): DispatchPayload {
    return {
      dispatchDate: dateToApiDate(this.form.controls.dispatchDate.value),
      title: this.form.controls.title.value,
      factory: this.form.controls.factory.value,
      groups: this.groups.controls.map((group, groupIndex) => ({
        sortOrder: groupIndex,
        items: group.controls.items.controls
          .map((item, itemIndex): DispatchItemPayload | null => {
            const value = item.getRawValue();
            if (!value.productId || !value.quantity) {
              return null;
            }
            return {
              productId: value.productId,
              quantity: value.quantity,
              description: value.description.trim() || null,
              sortOrder: itemIndex,
              allocations: value.allocations
            };
          })
          .filter((item): item is DispatchItemPayload => item !== null)
      })).filter(group => group.items.length > 0)
    };
  }

  private persist(silent: boolean) {
    const payload = this.payload();
    if (this.hasIncompleteRows()) {
        return of(null);
    }
    if (!this.form.valid || payload.groups.length === 0) {
      return of(null);
    }
    this.saving.set(true);
    return this.dispatchService.save(payload, this.selectedDispatch()?.id).pipe(
      tap(dispatch => {
        if (dispatch) {
          this.selectedDispatch.set(dispatch);
          this.lastSavedAt.set(new Date());
          this.dirty.set(false);
          this.dispatchSearch?.refresh();
          if (!silent) {
            this.snackBar.open('Saved', 'OK', { duration: 1500 });
          }
        }
      }),
      finalize(() => this.saving.set(false))
    );
  }

  // private focusLastProduct(): void {
  //   const input = this.productInputs?.last;
  //   const trigger = this.autocompleteTriggers?.last;

  //   if (!input || !trigger) return;

  //   input.nativeElement.focus();

  //   requestAnimationFrame(() => {
  //     this.productSearch$.next('');
  //     trigger.openPanel();
  //   });
  // }

  private focusQuantity(groupIndex: number, itemIndex: number): void {
    this.rememberRow(groupIndex, itemIndex);
    this.focusByFlatIndex(this.quantityInputs, groupIndex, itemIndex);
  }

  private focusByFlatIndex(inputs: QueryList<ElementRef<HTMLInputElement>> | undefined, groupIndex: number, itemIndex: number): void {
    const flatIndex = this.getFlatIndex(groupIndex, itemIndex);
    inputs?.get(flatIndex)?.nativeElement.focus();
  }

  private closeAllAutocompletePanels(): void {
    this.autocompleteTriggers?.forEach(trigger => trigger.closePanel());
  }

  private reindex(): void {
    this.groups.updateValueAndValidity();
  }
}
