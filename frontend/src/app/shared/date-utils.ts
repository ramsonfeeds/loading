export function todayDate(): Date {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

export function todayInputValue(): string {
  return dateToApiDate(todayDate());
}

export function dateToApiDate(value: Date | null): string {
  if (!value) {
    return todayInputValue();
  }
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
}

export function apiDateToDate(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function formatDisplayDate(value: Date | string | null): string {
  if (!value) {
    return '';
  }
  const date = typeof value === 'string' ? apiDateToDate(value) : value;
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}
