import { AsyncPipe, NgFor } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { BehaviorSubject, combineLatest, debounceTime, startWith, switchMap } from 'rxjs';
import { Dispatch } from '../../core/models';
import { DispatchService } from '../../core/dispatch.service';
import { dateToApiDate, formatDisplayDate, todayDate } from '../../shared/date-utils';

@Component({
  selector: 'app-dispatch-search',
  standalone: true,
  imports: [
    AsyncPipe,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    NgFor,
    ReactiveFormsModule
  ],
  templateUrl: './dispatch-search.component.html',
  styleUrl: './dispatch-search.component.scss'
})
export class DispatchSearchComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dispatchService = inject(DispatchService);
  private readonly refresh$ = new BehaviorSubject<void>(undefined);

  @Output() readonly selected = new EventEmitter<Dispatch>();
  @Output() readonly duplicated = new EventEmitter<Dispatch>();
  @Output() readonly deleted = new EventEmitter<Dispatch>();

  readonly form = this.fb.nonNullable.group({
    date: this.fb.control<Date | null>(todayDate())
  });

  readonly dispatches$ = combineLatest([
    this.form.valueChanges.pipe(startWith(this.form.getRawValue()), debounceTime(200)),
    this.refresh$
  ]).pipe(
    switchMap(([value]) => this.dispatchService.list({ date: dateToApiDate(value.date ?? null) }))
  );

  refresh(): void {
    this.refresh$.next();
  }

  displayDate(value: string): string {
    return formatDisplayDate(value);
  }
}
