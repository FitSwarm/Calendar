// we had some legacy code that used RRule library,
// it loaded ans saved in RRule format.
//
// We found that RRule did not generate dates with the same hour presistent 
// across local summer timezone changes. like when local timezone changed
// the scheduleld time stayed in utc and local time chagned.
// the oposite of what was expected
// when converted to local summer time the hours were shifting,
// So I was searching for RRule alternative

// however the lunartick library generated dates with clock well stable lacally in local timezone changes.

// so here I convert a RRule object to Rule Object

// also there is an example for until
// also RRule.all(fn) could accept a function
// so i developed this part too.

// for our use-case(30 repetitions at max) so I had limited the amount to 100.
// however you could not need it and it might cause a a bug for you. 
// maybe to delete the condition from for loop like
// for (let i = 0; ; i += 1) {

// look how i use .getnext
// I have tzId set


// eslint-disable-next-line camelcase
import { FREQUENCIES as FREQUENCIES_from_lunartick2 } from 'lunartick/src/constants';
import  Rule  from 'lunartick/src/rule';
import  TimezoneDate from 'lunartick/src/timezone_date';
import * as rrule1 from 'rrule';

// eslint-disable-next-line camelcase
const FREQUENCIES_from_rrule1 = rrule1.RRule.FREQUENCIES;


function ifEmptyThenUndefined(x) {
  if (x === null || (x instanceof Array && x.length === 0) || x === '')
    return undefined;
  return x;
}

export function getDatesRRuleFix(RRuleValue:rrule1.RRule, conditionFn: {(date: Date, i: number): boolean} ) : Date[] {
  // it creates recurring dates, based on a time zone from timezone view.

  // replace RRuleValue.all()  with getDatesRRuleFix(RRuleValue)

  // RRuleValue needs a tzid

  // convert jakubroztocil RRule To lunartick Rule and to Dates Array
  const r2 = new Rule({
    frequency:
      FREQUENCIES_from_lunartick2[
        FREQUENCIES_from_rrule1[RRuleValue.options.freq]
      ],
    interval: ifEmptyThenUndefined(RRuleValue.options.interval),
    count: ifEmptyThenUndefined(RRuleValue.options.count),
    bySetPos: ifEmptyThenUndefined(RRuleValue.options.bysetpos),
    byYearDay: ifEmptyThenUndefined(RRuleValue.options.byyearday),
    byMonth: ifEmptyThenUndefined(RRuleValue.options.bymonth),
    byMonthDay: ifEmptyThenUndefined(RRuleValue.options.bymonthday),
    byWeekNo: ifEmptyThenUndefined(RRuleValue.options.byweekno),
    byEaster: ifEmptyThenUndefined(RRuleValue.options.byeaster),
    byDay: ifEmptyThenUndefined(RRuleValue.options.byweekday),
    byHour: ifEmptyThenUndefined(RRuleValue.options.byhour),
    byMinute: ifEmptyThenUndefined(RRuleValue.options.byminute),
    bySecond: ifEmptyThenUndefined(RRuleValue.options.bysecond),
    tzId: ifEmptyThenUndefined(RRuleValue.options.tzid),
    dtStart: ifEmptyThenUndefined(RRuleValue.options.dtstart),
  });

  // i did not added the these options, because I did not found matching
  // RRuleValue.options: {
  //  wkst: 0,
  //  until: null, // implemented below
  //  bynmonthday: [],
  //  byweekno: null,
  //  bynweekday: null,
  // }

  const until = RRuleValue.options.until;
  if (until && conditionFn) {
    const untilGetTime = until.getTime();
    const untilCount = RRuleValue.options.count || 100;
    const iterator = r2.iterator();
    let start=new TimezoneDate(r2.dtStart, r2.tzId);
    const dates: Date[] = [];
    for (let i = 0; i < untilCount; i += 1) {
      const date = (start=iterator.getNext(start)).toDate();
      if (date.getTime() > untilGetTime) break;
      if (!conditionFn(date, i)) break;
      dates.push(date);
    }
    return dates;
  }
  if (conditionFn) {
    const untilCount = RRuleValue.options.count || 100;
    const iterator = r2.iterator();
    let start=new TimezoneDate(r2.dtStart, r2.tzId);
    const dates: Date[] = [];
    for (let i = 0; i < untilCount; i += 1) {
      const date = (start=iterator.getNext(start)).toDate();
      if (!conditionFn(date, i)) break;
      dates.push(date);
    }
    return dates;
  }
  if (until) {
    const untilGetTime = until.getTime();
    const untilCount = RRuleValue.options.count || 100;
    const iterator = r2.iterator();
    let start=new TimezoneDate(r2.dtStart, r2.tzId);
    const dates: Date[] = [];
    for (let i = 0; i < untilCount; i += 1) {
      const date = (start=iterator.getNext(start)).toDate();
      if (date.getTime() > untilGetTime) break;
      dates.push(date);
    }
    return dates;
  }

  return Array.from(
    r2.iterator(new TimezoneDate(r2.dtStart, r2.tzId)),
  ).map( (x:TimezoneDate) => x.toDate());
}



/*
// my usage was like:

  const rule = new RRule({
    freq: frequencyMap[frequency],
    interval,
    bymonth,
    bymonthday,
    byweekday,
    byhour,
    byminute,
    bysecond,
    dtstart: new Date(recurringClass.get('recurrenceStart')),
    tzid,
    until,
    count
  });

  const occurrenceDates = getDatesRRuleFix(rule,function (date, i) {
    return i < config.get('maxRecurringClassOccurrences');
  });

  const recurrenceString = rule.toString();
  const recurrenceText = rule.toText();



// more pieces from my code

export function getTimezone(ofDateWithTimezone) {
  const tz = moment.tz.guess();
  if (!isMoment(ofDateWithTimezone))
    // eslint-disable-next-line no-param-reassign
    ofDateWithTimezone = moment(ofDateWithTimezone);
  // const ofDateWithTimezone = moment.tz(tz);
  const offset = ofDateWithTimezone.format('Z');
  // .abbr(ofDateWithTimezone.utcOffset()) is incorrect use.
  // because daylight saving is dependant on date not timezone offset.
  const abbr = moment.tz.zone(tz).abbr(ofDateWithTimezone);
  // .abbrs is an array of 241 elements, but .utcOffset() is in minutes
  // to choose from .abbrs by minutes is incorrect
  // const secondAbbr = moment.tz.zone(tz).abbrs[ofDateWithTimezone.utcOffset()];
  // if (abbr === 'BST' && secondAbbr) {
  //  abbr = secondAbbr;
  // }

  return {
    value: tz,
    offset,
    abbr,
  };
}

  const timeZoneLocationName = getTimezone(new Date()).value;



    const rule = new RRule({
      freq: RRule.WEEKLY,
      interval: 1,
      byweekday: selectedDays.map(day => {
        return RRule[day];
      }),
      dtstart: new Date(date),
      until,
      count,
      tzid: timeZoneLocationName,
    });


*/

