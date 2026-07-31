import { NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Dispatch, Factory } from '../core/models';

export type PrintOptionsMode = 'loading' | 'production';

export interface PrintOptions {
  loadingCopies: 1 | 2;
  loadingDispatchCopies: Record<number, 0 | 1 | 2>;
  productionFactories: Factory[];
}

export interface PrintOptionsDialogData {
  mode: PrintOptionsMode;
  loadingDispatches?: Dispatch[];
  defaultDispatchId?: number | null;
}

@Component({
  selector: 'app-print-options-dialog',
  standalone: true,
  imports: [MatButtonModule, MatCheckboxModule, MatDialogModule, NgFor, NgIf],
  template: `
    <h2 mat-dialog-title>Print Options</h2>

    <mat-dialog-content>
      <section *ngIf="mode === 'loading'">
        <h3>Loading Lists</h3>
        <div *ngIf="loadingDispatches.length === 0" class="empty">No dispatches found for this date.</div>
        <div *ngFor="let dispatch of loadingDispatches" class="dispatch-option">
          <div class="dispatch-title">
            <strong>{{ dispatch.title || 'Untitled' }}</strong>
            <small>Factory {{ dispatch.factory }}</small>
          </div>
          <div class="copy-options">
            <mat-checkbox
              [checked]="dispatchCopies(dispatch.id) === 1"
              (change)="setDispatchCopies(dispatch.id, 1, $event.checked)">
              1 Copy
            </mat-checkbox>
            <mat-checkbox
              [checked]="dispatchCopies(dispatch.id) === 2"
              (change)="setDispatchCopies(dispatch.id, 2, $event.checked)">
              2 Copy
            </mat-checkbox>
          </div>
        </div>
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
      <button mat-flat-button color="primary" type="button" [disabled]="printDisabled()" (click)="print()">Print</button>
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

    .empty {
      color: #5f6670;
      font-size: 13px;
    }

    .dispatch-option {
      display: grid;
      gap: 8px;
      padding: 10px;
      border: 1px solid #d7dbe0;
      border-radius: 6px;
    }

    .dispatch-title {
      display: grid;
      gap: 2px;
    }

    small {
      color: #5f6670;
    }

    .copy-options {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
  `]
})
export class PrintOptionsDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<PrintOptionsDialogComponent, PrintOptions>);
  private readonly data = inject<PrintOptionsDialogData>(MAT_DIALOG_DATA);

  readonly factories: Factory[] = ['R', 'S'];
  readonly mode = this.data.mode;
  readonly loadingDispatches = this.data.loadingDispatches ?? [];
  loadingCopies: 1 | 2 = 2;
  loadingDispatchCopies = this.createLoadingDispatchCopies();
  productionFactories: Factory[] = ['R', 'S'];

  setLoadingCopies(copies: 1 | 2): void {
    this.loadingCopies = copies;
  }

  dispatchCopies(dispatchId: number): 0 | 1 | 2 {
    return this.loadingDispatchCopies[dispatchId] ?? 0;
  }

  setDispatchCopies(dispatchId: number, copies: 1 | 2, checked: boolean): void {
    this.loadingDispatchCopies = {
      ...this.loadingDispatchCopies,
      [dispatchId]: checked ? copies : 0
    };
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
      loadingDispatchCopies: this.loadingDispatchCopies,
      productionFactories: this.productionFactories
    });
  }

  printDisabled(): boolean {
    if (this.mode === 'loading') {
      return !Object.values(this.loadingDispatchCopies).some(copies => copies > 0);
    }

    return this.productionFactories.length === 0;
  }

  private createLoadingDispatchCopies(): Record<number, 0 | 1 | 2> {
    const defaultDispatchId = this.data.defaultDispatchId;

    return Object.fromEntries(
      this.loadingDispatches.map(dispatch => [
        dispatch.id,
        dispatch.id === defaultDispatchId ? 2 : 0
      ])
    );
  }
}
