import { NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Factory } from '../core/models';

export type PrintOptionsMode = 'loading' | 'production';

export interface PrintOptions {
  loadingCopies: 1 | 2;
  productionFactories: Factory[];
}

@Component({
  selector: 'app-print-options-dialog',
  standalone: true,
  imports: [MatButtonModule, MatCheckboxModule, MatDialogModule, NgFor, NgIf],
  template: `
    <h2 mat-dialog-title>Print Options</h2>

    <mat-dialog-content>
      <section *ngIf="mode === 'loading'">
        <h3>Loading List Copies</h3>
        <mat-checkbox [checked]="loadingCopies === 1" (change)="setLoadingCopies(1)">1 Copy</mat-checkbox>
        <mat-checkbox [checked]="loadingCopies === 2" (change)="setLoadingCopies(2)">2 Copy</mat-checkbox>
      </section>

      <section *ngIf="mode === 'production'">
        <h3>Production Lists</h3>
        <mat-checkbox
          *ngFor="let factory of factories"
          [checked]="productionFactories.includes(factory)"
          (change)="toggleFactory(factory)">
          Factory {{ factory }}
        </mat-checkbox>
      </section>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" type="button" [disabled]="productionFactories.length === 0" (click)="print()">Print</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      display: grid;
      gap: 18px;
      min-width: 280px;
    }

    section {
      display: grid;
      gap: 8px;
    }

    h3 {
      margin: 0;
      color: #34383d;
      font-size: 14px;
      font-weight: 600;
    }
  `]
})
export class PrintOptionsDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<PrintOptionsDialogComponent, PrintOptions>);
  private readonly data = inject<{ mode: PrintOptionsMode }>(MAT_DIALOG_DATA);

  readonly factories: Factory[] = ['R', 'S'];
  readonly mode = this.data.mode;
  loadingCopies: 1 | 2 = 2;
  productionFactories: Factory[] = ['R', 'S'];

  setLoadingCopies(copies: 1 | 2): void {
    this.loadingCopies = copies;
  }

  toggleFactory(factory: Factory): void {
    if (this.productionFactories.includes(factory)) {
      if (this.productionFactories.length === 1) {
        return;
      }

      this.productionFactories = this.productionFactories.filter(item => item !== factory);
      return;
    }

    this.productionFactories = [...this.productionFactories, factory].sort();
  }

  print(): void {
    this.dialogRef.close({
      loadingCopies: this.loadingCopies,
      productionFactories: this.productionFactories
    });
  }
}
