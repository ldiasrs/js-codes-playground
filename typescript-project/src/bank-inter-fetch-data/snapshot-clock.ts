function pad(value: number, size = 2): string {
  return String(value).padStart(size, "0");
}

function toIsoDate(date: Date): string {
  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join("-");
}

export class SnapshotClock {
  constructor(private readonly now: Date = new Date()) {}

  folderName(): string {
    const time = `${pad(this.now.getHours())}h${pad(this.now.getMinutes())}m${pad(this.now.getSeconds())}`;
    return `${this.isoDate()}-${time}`;
  }

  isoDate(): string {
    return toIsoDate(this.now);
  }

  queryDate(): string {
    return this.isoDate().replaceAll("-", "");
  }

  daysAgoIso(days: number): string {
    const date = new Date(this.now);
    date.setDate(date.getDate() - days);
    return toIsoDate(date);
  }

  /** OPEN invoice closing date: last day of the current month, DDMMYYYY. */
  invoiceClosingDate(): string {
    const lastDay = new Date(this.now.getFullYear(), this.now.getMonth() + 1, 0);
    return `${pad(lastDay.getDate())}${pad(lastDay.getMonth() + 1)}${lastDay.getFullYear()}`;
  }
}
