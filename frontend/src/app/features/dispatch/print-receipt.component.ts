import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { Component, ElementRef, Input, QueryList, ViewChildren } from '@angular/core';
import { AllocationSource, DispatchGroup, DispatchItem, Factory, WeightLine } from '../../core/models';
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
  @Input({ required: true }) factory!: Factory;
  @Input({ required: true }) groups: DispatchGroup[] = [];
  @Input({ required: true }) weightLines: WeightLine[] = [];
  @Input({ required: true }) totalWeight = 0;

  @ViewChildren('page') private readonly pages?: QueryList<ElementRef<HTMLElement>>;

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

  productionAllocations(item: DispatchItem) {
    return (item.allocations  ?? []).filter(allocation => allocation.source === 'PRODUCTION');
  }

  stockAllocations(item: DispatchItem) {
    return (item.allocations  ?? []).filter(allocation => allocation.source === 'STOCK');
  }

  hasAllocations(item: DispatchItem): boolean {
    return (item.allocations?.length ?? 0) > 0;
  }

  allocationTotal(item: DispatchItem, source: AllocationSource): number {
    return (item.allocations  ?? [])
      .filter(allocation => allocation.source === source)
      .reduce((sum, allocation) => sum + allocation.quantity, 0);
  }

  showFactory(parentFactory: Factory, allocationFactory: Factory): boolean {
    return allocationFactory !== parentFactory;
  }

  prepareScale(): void {
    const pages = this.pages?.toArray().map(page => page.nativeElement) ?? [];
    if (pages.length === 0) {
      return;
    }
    this.scale = 1;
    pages.forEach(page => page.style.setProperty('--print-scale', '1'));
    const printableHeightPx = 30 * 37.7952755906;
    const renderedHeight = Math.max(...pages.map(page => page.scrollHeight));
    this.scale = Math.min(1, printableHeightPx / renderedHeight);
    pages.forEach(page => page.style.setProperty('--print-scale', `${this.scale}`));
  }
}
