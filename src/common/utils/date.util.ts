import { defaultTimezone } from '@common/constants';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

dayjs.tz.setDefault(defaultTimezone);

export const dayjsObjectWithTimezone = (date?: Date | string, tz = defaultTimezone) => {
  return dayjs.tz(date, tz);
};

export const getStartAndEndOfDay = (date: Date | string) => {
  if (!date) throw new Error('Invalid date input');

  const parsed = dayjsObjectWithTimezone(date, defaultTimezone);
  if (!parsed.isValid()) throw new Error('Invalid date input');

  const dayOnly = parsed.format('YYYY-MM-DD');
  const base = dayjs.tz(`${dayOnly} 00:00:00`, 'YYYY-MM-DD HH:mm:ss', defaultTimezone);

  const startOfDay = base.startOf('day').toDate();
  const endOfDay = base.endOf('day').toDate();

  return { startOfDay, endOfDay };
};
