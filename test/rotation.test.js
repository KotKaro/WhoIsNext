import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  changeQueue, cleanNames, mondayOf, startTeam, takeTurn, todayIn, viewOf, weekOf,
} from '../src/rotation.js';

describe('mondayOf', () => {
  it('Sunday belongs to the week that started the Monday before', () => {
    // Act
    const monday = mondayOf('2026-11-29');

    // Assert
    assert.equal(monday, '2026-11-23');
  });

  it('a Monday is its own week start', () => {
    // Act
    const monday = mondayOf('2026-11-23');

    // Assert
    assert.equal(monday, '2026-11-23');
  });
});

describe('todayIn', () => {
  it('half past midnight on Monday in Warsaw is Monday, though still Sunday in UTC', () => {
    // Act
    const today = todayIn('Europe/Warsaw', new Date('2026-11-22T23:30:00Z'));

    // Assert
    assert.equal(today, '2026-11-23');
  });
});

describe('weekOf', () => {
  it('numbers weeks as ISO 8601 does', () => {
    // Act
    const weeks = ['2026-11-23', '2025-12-29', '2026-12-28', '2027-01-04'].map((monday) => weekOf(monday).number);

    // Assert
    assert.deepEqual(weeks, [48, 1, 53, 1]);
  });
});

describe('viewOf', () => {
  it('new team: the first name presents this week, the others follow week by week', () => {
    // Arrange
    const team = startTeam(['Anna', 'Bartek', 'Celina'], '2026-11-23');

    // Act
    const view = viewOf(team, '2026-11-23');

    // Assert
    assert.deepEqual(view.queue, [
      { name: 'Anna', week: { start: '2026-11-23', number: 48 }, turns: 1 },
      { name: 'Bartek', week: { start: '2026-11-30', number: 49 }, turns: 0 },
      { name: 'Celina', week: { start: '2026-12-07', number: 50 }, turns: 0 },
    ]);
  });

  it('five weeks in: the queue has moved on and counts every week so far', () => {
    // Arrange
    const team = startTeam(['Anna', 'Bartek', 'Celina'], '2026-11-02');

    // Act
    const view = viewOf(team, '2026-11-30');

    // Assert
    assert.deepEqual(view.queue.map(({ name, turns }) => [name, turns]), [['Bartek', 2], ['Celina', 1], ['Anna', 2]]);
  });

  it('history lists every week, newest first, with who presented', () => {
    // Arrange
    const team = startTeam(['Anna', 'Bartek'], '2026-11-09');

    // Act
    const view = viewOf(team, '2026-11-23');

    // Assert
    assert.deepEqual(view.history, [
      { week: { start: '2026-11-23', number: 48 }, name: 'Anna' },
      { week: { start: '2026-11-16', number: 47 }, name: 'Bartek' },
      { week: { start: '2026-11-09', number: 46 }, name: 'Anna' },
    ]);
  });
});

describe('changeQueue', () => {
  it('the first name of the new queue presents this week, and past weeks keep who presented', () => {
    // Arrange
    const team = startTeam(['Anna', 'Bartek', 'Celina'], '2026-11-02');

    // Act
    const changed = changeQueue(team, ['Celina', 'Dawid', 'Anna'], '2026-11-16');

    // Assert
    const view = viewOf(changed, '2026-11-16');
    assert.deepEqual(view.history.map(({ name }) => name), ['Celina', 'Bartek', 'Anna']);
  });

  it('a newcomer starts at zero, people still in the queue keep their count, someone removed is left out', () => {
    // Arrange
    const team = startTeam(['Anna', 'Bartek', 'Celina'], '2026-11-02');

    // Act
    const changed = changeQueue(team, ['Celina', 'Dawid', 'Anna'], '2026-11-16');

    // Assert
    const view = viewOf(changed, '2026-11-16');
    assert.deepEqual(view.queue.map(({ name, turns }) => [name, turns]), [['Celina', 1], ['Dawid', 0], ['Anna', 1]]);
  });

  it('a second change in the same week replaces the first one', () => {
    // Arrange
    const team = changeQueue(startTeam(['Anna', 'Bartek'], '2026-11-02'), ['Bartek', 'Anna'], '2026-11-16');

    // Act
    const changed = changeQueue(team, ['Anna', 'Bartek'], '2026-11-16');

    // Assert
    assert.deepEqual(changed.queues.map(({ from }) => from), ['2026-11-02', '2026-11-16']);
  });

  it('weeks after a change rotate through the new queue', () => {
    // Arrange
    const team = changeQueue(startTeam(['Anna', 'Bartek'], '2026-11-02'), ['Celina', 'Anna'], '2026-11-16');

    // Act
    const view = viewOf(team, '2026-11-30');

    // Assert
    assert.deepEqual(view.history.map(({ name }) => name), ['Celina', 'Anna', 'Celina', 'Bartek', 'Anna']);
  });
});

describe('takeTurn', () => {
  it('the person presents this week and whoever was due takes their turn, nobody else moves', () => {
    // Arrange
    const team = startTeam(['Anna', 'Bartek', 'Celina', 'Dawid'], '2026-11-23');

    // Act
    const { team: changed } = takeTurn(team, 'Celina', '2026-11-23');

    // Assert
    assert.deepEqual(viewOf(changed, '2026-11-23').queue.map(({ name }) => name), ['Celina', 'Bartek', 'Anna', 'Dawid']);
  });

  it('this week shows who presents instead of whom', () => {
    // Arrange
    const team = startTeam(['Anna', 'Bartek', 'Celina'], '2026-11-16');

    // Act
    const { team: changed } = takeTurn(team, 'Anna', '2026-11-23');

    // Assert
    assert.deepEqual(viewOf(changed, '2026-11-23').history[0], {
      week: { start: '2026-11-23', number: 48 },
      name: 'Anna',
      insteadOf: 'Bartek',
    });
  });

  it('a team started this week still shows who presents instead of whom', () => {
    // Arrange
    const team = startTeam(['Anna', 'Bartek', 'Celina'], '2026-11-23');

    // Act
    const { team: changed } = takeTurn(team, 'Celina', '2026-11-23');

    // Assert
    assert.equal(viewOf(changed, '2026-11-23').history[0].insteadOf, 'Anna');
  });

  it('two takeovers in one week name who was due before both', () => {
    // Arrange
    const team = startTeam(['Anna', 'Bartek', 'Celina'], '2026-11-16');
    const { team: taken } = takeTurn(team, 'Celina', '2026-11-23');

    // Act
    const { team: takenAgain } = takeTurn(taken, 'Anna', '2026-11-23');

    // Assert
    assert.equal(viewOf(takenAgain, '2026-11-23').history[0].insteadOf, 'Bartek');
  });

  it('the person who was due taking it back restores the queue', () => {
    // Arrange
    const team = startTeam(['Anna', 'Bartek', 'Celina', 'Dawid'], '2026-11-16');
    const { team: taken } = takeTurn(team, 'Dawid', '2026-11-23');

    // Act
    const { team: takenBack } = takeTurn(taken, 'Bartek', '2026-11-23');

    // Assert
    const view = viewOf(takenBack, '2026-11-23');
    assert.deepEqual(view.queue.map(({ name }) => name), ['Bartek', 'Celina', 'Dawid', 'Anna']);
    assert.equal(view.history[0].insteadOf, undefined);
  });

  it('the person already presenting changes nothing', () => {
    // Arrange
    const team = startTeam(['Anna', 'Bartek'], '2026-11-23');

    // Act
    const result = takeTurn(team, 'Anna', '2026-11-23');

    // Assert
    assert.equal(result.team, team);
  });

  it('someone no longer in the queue is refused', () => {
    // Act
    const result = takeTurn(startTeam(['Anna', 'Bartek'], '2026-11-23'), 'Celina', '2026-11-23');

    // Assert
    assert.deepEqual(result, { problem: '"Celina" is not in the queue any more.' });
  });
});

describe('cleanNames', () => {
  it('trims names and drops empty lines', () => {
    // Act
    const result = cleanNames(['  Anna ', '', '   ', 'Bartek']);

    // Assert
    assert.deepEqual(result, { names: ['Anna', 'Bartek'] });
  });

  it('the same name twice, in any case, is refused', () => {
    // Act
    const result = cleanNames(['Anna', 'ANNA']);

    // Assert
    assert.deepEqual(result, { problem: '"ANNA" is on the list twice.' });
  });

  it('no names is refused', () => {
    // Act
    const result = cleanNames(['', ' ']);

    // Assert
    assert.deepEqual(result, { problem: 'Add at least one name.' });
  });

  it('a name over 40 characters is refused', () => {
    // Act
    const result = cleanNames(['A'.repeat(41)]);

    // Assert
    assert.ok(result.problem.endsWith('is longer than 40 characters.'));
  });

  it('anything but a list of text is refused', () => {
    // Act
    const results = [undefined, 'Anna', [1]].map(cleanNames);

    // Assert
    assert.ok(results.every(({ problem }) => problem === 'Names must be a list of text.'));
  });
});
