const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', 'last'];

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date, months) {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDayOfTargetMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDayOfTargetMonth));
  return result;
}

function addYears(date, years) {
  return addMonths(date, years * 12);
}

function weekOfMonthOrdinalIndex(date) {
  return Math.floor((date.getDate() - 1) / 7);
}

function isLastOccurrenceOfWeekdayInMonth(date) {
  const next = addDays(date, 7);
  return next.getMonth() !== date.getMonth();
}

function matchesOrdinal(date, ordinal) {
  if (ordinal === 'last') return isLastOccurrenceOfWeekdayInMonth(date);
  const index = ORDINALS.indexOf(ordinal);
  return weekOfMonthOrdinalIndex(date) === index;
}

function nthWeekdayOfMonth(year, month, weekdayIndex, ordinal) {
  if (ordinal === 'last') {
    const last = new Date(year, month + 1, 0);
    const diff = (last.getDay() - weekdayIndex + 7) % 7;
    return addDays(last, -diff);
  }
  const index = ORDINALS.indexOf(ordinal);
  const first = new Date(year, month, 1);
  const diff = (weekdayIndex - first.getDay() + 7) % 7;
  return addDays(first, diff + index * 7);
}

function* iterateCandidates(rule, anchorDate) {
  const interval = rule.interval || 1;
  const repeatType = rule.repeatType;

  if (repeatType === 'daily') {
    let cursor = addDays(anchorDate, interval);
    while (true) {
      yield cursor;
      cursor = addDays(cursor, interval);
    }
  }

  if (repeatType === 'weekly') {
    const weeklyDays = rule.weeklyDays && rule.weeklyDays.length ? rule.weeklyDays : [WEEKDAYS[anchorDate.getDay()]];
    let weekCursor = addDays(anchorDate, -anchorDate.getDay());
    while (true) {
      const dayCandidates = weeklyDays
        .map((dayName) => addDays(weekCursor, WEEKDAYS.indexOf(dayName)))
        .filter((date) => date > anchorDate)
        .sort((a, b) => a - b);
      for (const candidate of dayCandidates) {
        if (rule.weeklyPeriodType && rule.weeklyPeriodType !== 'every') {
          const ordinalIndex = weekOfMonthOrdinalIndex(candidate);
          const isOddWeek = ordinalIndex % 2 === 0;
          if (rule.weeklyPeriodType === '1st_3rd' && !isOddWeek) continue;
          if (rule.weeklyPeriodType === '2nd_4th' && isOddWeek) continue;
        }
        yield candidate;
      }
      weekCursor = addDays(weekCursor, 7 * interval);
    }
  }

  if (repeatType === 'monthly') {
    let cursor = anchorDate;
    if (rule.repeatBy === 'day_of_week') {
      const weekdayIndex = anchorDate.getDay();
      const ordinal = ORDINALS[Math.min(weekOfMonthOrdinalIndex(anchorDate), ORDINALS.length - 2)];
      let monthCursor = addMonths(anchorDate, interval);
      while (true) {
        yield nthWeekdayOfMonth(monthCursor.getFullYear(), monthCursor.getMonth(), weekdayIndex, ordinal);
        monthCursor = addMonths(monthCursor, interval);
      }
    } else {
      while (true) {
        cursor = addMonths(cursor, interval);
        yield cursor;
      }
    }
  }

  if (repeatType === 'yearly') {
    let cursor = anchorDate;
    while (true) {
      cursor = addYears(cursor, interval);
      yield cursor;
    }
  }
}

function isExcepted(date, rule) {
  if (!rule.exceptType || rule.exceptType === 'off') return false;
  if (rule.exceptType === 'month') {
    const monthName = date.toLocaleString('en-US', { month: 'long' }).toLowerCase();
    return (rule.exceptMonths || []).map((month) => month.toLowerCase()).includes(monthName);
  }
  if (rule.exceptType === 'condition') {
    if (!rule.exceptOrdinal || !rule.exceptWeekday) return false;
    const weekdayIndex = WEEKDAYS.indexOf(rule.exceptWeekday);
    if (date.getDay() !== weekdayIndex) return false;
    if (rule.exceptUnit === 'month') return matchesOrdinal(date, rule.exceptOrdinal);
    if (rule.exceptUnit === 'week') return true;
  }
  return false;
}

/**
 * Computes the recurrence rule's next occurrence dates strictly after `anchorDate`
 * and within [windowStart, windowEnd], applying endsType/endsCount/endsDate limits
 * and except* exclusions. endsCount is interpreted as a cap on occurrences counted
 * forward from anchorDate (the rule's history before the anchor isn't tracked here).
 */
export function computeNextOccurrences(rule, { anchorDate, windowStart, windowEnd }) {
  if (!rule || !rule.repeatType || rule.repeatType === 'off' || rule.repeatType === 'does_not_repeat') return [];

  const results = [];
  let occurrenceCount = 0;
  const iterator = iterateCandidates(rule, new Date(anchorDate));

  for (const candidate of iterator) {
    if (candidate > windowEnd) break;
    if (rule.endsType === 'on_date' && rule.endsDate && candidate > new Date(rule.endsDate)) break;

    occurrenceCount += 1;
    if (rule.endsType === 'after' && rule.endsCount && occurrenceCount > rule.endsCount) break;

    if (candidate >= windowStart && !isExcepted(candidate, rule)) {
      results.push(candidate);
    }
  }

  return results;
}

export default { computeNextOccurrences };
