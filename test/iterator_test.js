const moment = require('moment-timezone');
const { expect } = require('chai');
const sinon = require('sinon');
const Iterator = require('../src/iterator');

describe('Iterator', () => {
  it('freezes time', () => {
    // TZ=America/Chicago yarn test
    // TZ=Australia/Sydney yarn test
    const timer = sinon.useFakeTimers(Date.UTC(2016, 3, 12, 11));

    const iterator = new Iterator({
      frequency: 3,
      byDay: [12],
      byHour: [10],
      byMinute: [30],
      tzId: 'America/Los_Angeles',
    });

    const next = iterator.getNext(new Date());

    expect(next.toISOString()).to.equal('2016-04-12T17:30:00.000Z');
    expect(next.getDate()).to.equal(12);
    expect(next.getHours()).to.equal(10);
    expect(next.getMinutes()).to.equal(30);

    timer.restore();
  });

  it('hours should stay the same local time when given a DST timezone', () => {
    const timer = sinon.useFakeTimers(Date.UTC(2017, 2, 25, 0));

    const iterator = new Iterator({
      frequency: 4,
      byDay: [2],
      byHour: [10],
      byMinute: [30],
      tzId: 'Australia/Sydney',
      count: 2,
    });

    const nextEvents = Array.from(iterator);

    expect(nextEvents[0].getHours()).to.equal(10);
    expect(nextEvents[0].date.format('ZZ')).to.equal('+1100');
    expect(nextEvents[1].getHours()).to.equal(10);
    expect(nextEvents[1].date.format('ZZ')).to.equal('+1000');

    timer.restore();
  });

  it('it should support multiple weekdays', () => {
    const timer = sinon.useFakeTimers(Date.UTC(2017, 2, 26, 0));

    const iterator = new Iterator({
      frequency: 4,
      interval: 1,
      byDay: [0,1,2,3,4,5,6],
      byHour: [10],
      byMinute: [30],
      count: 7,
    });

    const day = Array.from(iterator).map(x => x.toDate());
    // console.log(day);

    function addDay(d) {
      let r=new Date(d);
      r.setDate(r.getDate() + 1);
      return r;
    }

    expect(day[1].getDate()).to.equal(addDay(day[0]).getDate());
    expect(day[2].getDate()).to.equal(addDay(day[1]).getDate());
    expect(day[3].getDate()).to.equal(addDay(day[2]).getDate());
    expect(day[4].getDate()).to.equal(addDay(day[3]).getDate());
    expect(day[5].getDate()).to.equal(addDay(day[4]).getDate());
    expect(day[6].getDate()).to.equal(addDay(day[5]).getDate());

    timer.restore();
  });

  it('hours should change local time when given a DST timezone', () => {
    const timer = sinon.useFakeTimers(Date.UTC(2017, 2, 26, 0));

    const iterator = new Iterator({
      frequency: 4,
      byDay: [3],
      byHour: [10],
      byMinute: [30],
      count: 2,
    });

    const nextEvents = Array.from(iterator);

    expect(nextEvents[0].date.tz('Australia/Sydney').hours()).to.equal(21);
    expect(nextEvents[0].date.format('ZZ')).to.equal('+1100');
    expect(nextEvents[1].date.tz('Australia/Sydney').hours()).to.equal(20);
    expect(nextEvents[1].date.format('ZZ')).to.equal('+1000');

    timer.restore();
  });

  it('must throw an error for an invalid rule passed in', () => {
    let err;
    try {
      new Iterator('chiasson');
    } catch (ex) {
      err = ex;
    }

    expect(err.message).to.equal('Invalid rule, no frequency property on rule.');
  });

  it('must throw an error for a rule with no frequency', () => {
    let err;
    try {
      new Iterator({ interval: 6 });
    } catch (ex) {
      err = ex;
    }

    expect(err.message).to.equal('Invalid rule, no frequency property on rule.');
  });

  it('must create a valid instance with a valid rule', () => {
    const iterator = new Iterator({ frequency: 1 });

    expect(iterator instanceof Iterator).to.equal(true);
  });

  it('must return a valid getNext date for a valid iterator with a start date', () => {
    const iterator = new Iterator({
      frequency: 3,
      byHour: [10],
      byMinute: [30],
      tzId: 'America/Los_Angeles',
    }, moment.tz('1988-02-10T00:00:00', 'America/Los_Angeles').toISOString());

    const nextRun = iterator.getNext(moment.tz('1988-02-10T00:00:00', 'America/Los_Angeles')
      .toISOString());

    expect(nextRun.getDate()).to.equal(10);
    expect(nextRun.getHours()).to.equal(10);
    expect(nextRun.getMinutes()).to.equal(30);
  });
});
