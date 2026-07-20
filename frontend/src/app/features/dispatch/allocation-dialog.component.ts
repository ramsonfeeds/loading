import { NgIf } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DispatchAllocationPayload } from '../../core/models';

export interface AllocationDialogData {
  productName: string;
  quantity: number;
  allocations: DispatchAllocationPayload[];
}

@Component({
  selector: 'app-allocation-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, NgIf, ReactiveFormsModule],
  templateUrl: './allocation-dialog.component.html',
  styleUrl: './allocation-dialog.component.scss'
})
export class AllocationDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AllocationDialogComponent, DispatchAllocationPayload[]>);

  readonly form = this.fb.nonNullable.group({
    rStock: [0, [Validators.min(0)]],
    sStock: [0, [Validators.min(0)]],
    rProduction: [0, [Validators.min(0)]],
    sProduction: [0, [Validators.min(0)]]
  });

  constructor(@Inject(MAT_DIALOG_DATA) readonly data: AllocationDialogData) {
    this.form.setValue({
      rStock: this.quantityFor('R', 'STOCK'),
      sStock: this.quantityFor('S', 'STOCK'),
      rProduction: this.quantityFor('R', 'PRODUCTION'),
      sProduction: this.quantityFor('S', 'PRODUCTION')
    });
  }

  total(): number {
    const value = this.form.getRawValue();
    return Number(value.rStock || 0) + Number(value.sStock || 0) + Number(value.rProduction || 0) + Number(value.sProduction || 0);
  }

  remaining(): number {
    return this.data.quantity - this.total();
  }

  canSave(): boolean {
    return this.form.valid && this.total() === this.data.quantity;
  }

  save(): void {
    if (!this.canSave()) {
      return;
    }

    const value = this.form.getRawValue();
    const allAllocations = [
      { factory: 'R', source: 'STOCK', quantity: Number(value.rStock || 0) },
      { factory: 'S', source: 'STOCK', quantity: Number(value.sStock || 0) },
      { factory: 'R', source: 'PRODUCTION', quantity: Number(value.rProduction || 0) },
      { factory: 'S', source: 'PRODUCTION', quantity: Number(value.sProduction || 0) }
    ] satisfies DispatchAllocationPayload[];
    const allocations = allAllocations.filter(allocation => allocation.quantity > 0);

    this.dialogRef.close(allocations);
  }

  clear(): void {
    this.dialogRef.close([]);
  }

  private quantityFor(factory: 'R' | 'S', source: 'STOCK' | 'PRODUCTION'): number {
    return this.data.allocations.find(allocation => allocation.factory === factory && allocation.source === source)?.quantity ?? 0;
  }
}
