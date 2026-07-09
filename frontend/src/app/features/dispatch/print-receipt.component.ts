import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { DispatchGroup, WeightLine } from '../../core/models';
import { formatDisplayDate } from '../../shared/date-utils';
import { grandTotal, groupTotal } from '../../shared/dispatch-totals';

@Component({
  selector: 'app-print-receipt',
  standalone: true,
  imports: [DecimalPipe, NgFor, NgIf],
  templateUrl: './print-receipt.component.html',
  styleUrl: './print-receipt.component.scss'
})
export class PrintReceiptComponent {
  @Input({ required: true }) date: Date | string | null = '';
  @Input({ required: true }) title = '';
  @Input({ required: true }) groups: DispatchGroup[] = [];
  @Input({ required: true }) weightLines: WeightLine[] = [];
  @Input({ required: true }) totalWeight = 0;

  @ViewChild('page') private readonly page?: ElementRef<HTMLElement>;

  scale = 1;

  totalBags(): number {
    return grandTotal(this.groups);
  }

  displayDate(): string {
    return formatDisplayDate(this.date);
  }

  groupTotal(group: DispatchGroup): number {
    return groupTotal(group);
  }

  isLastItem(group: DispatchGroup, index: number): boolean {
    return index === group.items.length - 1;
  }

  prepareScale(): void {
    const page = this.page?.nativeElement;
    if (!page) {
      return;
    }
    this.scale = 1;
    page.style.setProperty('--print-scale', '1');
    const printableHeightPx = 30 * 37.7952755906;
    const renderedHeight = page.scrollHeight;
    this.scale = Math.min(1, printableHeightPx / renderedHeight);
    page.style.setProperty('--print-scale', `${this.scale}`);
  }
}
