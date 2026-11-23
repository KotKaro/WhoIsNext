import { act, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { changePeopleElsewhere, createTeam, setToday, wednesdayOfWeek48 } from '../../test/fakeBackend';
import { renderApp } from '../../test/renderApp';
import { nameInput, queueNames, typedNames } from '../../test/screens';
import { text } from '../../text';

const weekInMilliseconds = 7 * 86_400_000;
// Date ranges put thin spaces around the dash; text found on the page has them as plain spaces.
const dash = ' – ';
const shownDash = ' – ';

describe('TeamPage', () => {
  it('TeamPage_UnknownLink_ShowsWhyAndAWayToStartOver', async () => {
    renderApp('/t/AAAAAAAAAAAAAAAAAAAAAA');

    expect(await screen.findByText('No team at this link. Check the link, or create a new team.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: text.createNewTeam })).toHaveAttribute('href', '/');
  });

  it('TeamPage_TeamLoaded_ShowsWhoPresentsThisWeekAndNext', async () => {
    const teamId = await createTeam(['Anna', 'Bartek']);

    renderApp(`/t/${teamId}`);

    expect(await screen.findByText(`This week · Week 48 · 23${shownDash}29 Nov`)).toBeInTheDocument();
    expect(screen.getByText('Anna', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText(`Next: Bartek · Week 49 · 30 Nov${shownDash}6 Dec`)).toBeInTheDocument();
    expect(document.title).toBe(text.presenter.documentTitle('Anna'));
    expect(screen.getByRole('textbox', { name: text.share.linkLabel })).toHaveValue(`http://localhost:3000/t/${teamId}`);
  });

  it('TeamPage_OnePerson_SaysTheyPresentAgainNextWeek', async () => {
    const teamId = await createTeam(['Anna']);

    renderApp(`/t/${teamId}`);

    expect(await screen.findByText(text.presenter.againNextWeek('Anna'))).toBeInTheDocument();
  });

  it('TeamPage_MyTurnConfirmed_SwapsWithThisWeeksPresenter', async () => {
    const teamId = await createTeam(['Anna', 'Bartek', 'Celina']);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { user } = renderApp(`/t/${teamId}`);

    await user.click(await screen.findByRole('button', { name: text.queue.myTurnLabel('Celina') }));

    expect(confirm).toHaveBeenCalledWith(
      text.queue.confirmTurn('Celina', 'Anna', `Week 50 · 7${dash}13 Dec`),
    );
    expect(await screen.findByText(text.presenter.insteadOf('Anna'))).toBeInTheDocument();
    expect(await queueNames()).toEqual(['Celina', 'Bartek', 'Anna']);
  });

  it('TeamPage_MyTurnCancelled_KeepsTheQueue', async () => {
    const teamId = await createTeam(['Anna', 'Bartek']);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { user } = renderApp(`/t/${teamId}`);

    await user.click(await screen.findByRole('button', { name: text.queue.myTurnLabel('Bartek') }));

    expect(await queueNames()).toEqual(['Anna', 'Bartek']);
    expect(screen.queryByText(text.presenter.insteadOf('Anna'))).not.toBeInTheDocument();
  });

  it('TeamPage_MyTurnForSomeoneRemovedMeanwhile_ShowsWhyAndTheQueueAsItIsNow', async () => {
    const teamId = await createTeam(['Anna', 'Bartek']);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { user } = renderApp(`/t/${teamId}`);
    const myTurn = await screen.findByRole('button', { name: text.queue.myTurnLabel('Bartek') });
    await changePeopleElsewhere(teamId, ['Anna', 'Celina']);

    await user.click(myTurn);

    expect(await screen.findByRole('alert')).toHaveTextContent('"Bartek" is not in the queue any more.');
    await vi.waitFor(async () => expect(await queueNames()).toEqual(['Anna', 'Celina']));
  });

  it('TeamPage_PeopleReorderedAndSaved_FirstPresentsInsteadOfWhoWasDue', async () => {
    const teamId = await createTeam(['Anna', 'Bartek', 'Celina']);
    const { user } = renderApp(`/t/${teamId}`);
    await user.click(await screen.findByRole('button', { name: text.queue.edit }));

    await user.click(screen.getByRole('button', { name: text.people.moveUp('Celina') }));
    await user.click(screen.getByRole('button', { name: text.people.moveUp('Celina') }));
    await user.click(screen.getByRole('button', { name: text.queue.save }));

    expect(await screen.findByText(text.presenter.insteadOf('Anna'))).toBeInTheDocument();
    expect(await queueNames()).toEqual(['Celina', 'Anna', 'Bartek']);
    expect(screen.queryByRole('button', { name: text.queue.save })).not.toBeInTheDocument();
  });

  it('TeamPage_EditOpened_StartsFromTheQueueWithTheFirstNameFocused', async () => {
    const teamId = await createTeam(['Anna', 'Bartek']);
    const { user } = renderApp(`/t/${teamId}`);

    await user.click(await screen.findByRole('button', { name: text.queue.edit }));

    expect(typedNames()).toEqual(['Anna', 'Bartek', '']);
    expect(nameInput(0)).toHaveFocus();
    expect(screen.getByRole('group', { name: text.queue.editLegend })).toBeInTheDocument();
  });

  it('TeamPage_EditCancelled_KeepsTheQueue', async () => {
    const teamId = await createTeam(['Anna', 'Bartek']);
    const { user } = renderApp(`/t/${teamId}`);
    await user.click(await screen.findByRole('button', { name: text.queue.edit }));
    await user.click(screen.getByRole('button', { name: text.people.moveDown('Anna') }));

    await user.click(screen.getByRole('button', { name: text.queue.cancel }));

    expect(await queueNames()).toEqual(['Anna', 'Bartek']);
    expect(screen.getByRole('button', { name: text.queue.edit })).toBeInTheDocument();
  });

  it('TeamPage_SavedWithADuplicate_ShowsWhyAndKeepsEditing', async () => {
    const teamId = await createTeam(['Anna', 'Bartek']);
    const { user } = renderApp(`/t/${teamId}`);
    await user.click(await screen.findByRole('button', { name: text.queue.edit }));

    await user.type(nameInput(-1), 'anna');
    await user.click(screen.getByRole('button', { name: text.queue.save }));

    expect(await screen.findByRole('alert')).toHaveTextContent('"anna" is on the list twice.');
    expect(screen.getByRole('button', { name: text.queue.save })).toBeInTheDocument();
  });

  it('TeamPage_MoreThanEightWeeks_ShowsTheRestOnRequest', async () => {
    setToday(new Date(wednesdayOfWeek48.getTime() - 9 * weekInMilliseconds));
    const teamId = await createTeam(['Anna', 'Bartek']);
    setToday(wednesdayOfWeek48);
    const { user } = renderApp(`/t/${teamId}`);
    const history = await screen.findByRole('table', { name: text.history.title });
    expect(within(history).getAllByRole('row')).toHaveLength(1 + 8);

    await user.click(screen.getByRole('button', { name: text.history.showAll(10) }));

    expect(within(history).getAllByRole('row')).toHaveLength(1 + 10);
    expect(screen.queryByRole('button', { name: text.history.showAll(10) })).not.toBeInTheDocument();
  });

  it('TeamPage_CopyPressed_CopiesTheTeamLink', async () => {
    const teamId = await createTeam(['Anna']);
    const { user } = renderApp(`/t/${teamId}`);

    await user.click(await screen.findByRole('button', { name: text.share.copy }));

    expect(await navigator.clipboard.readText()).toBe(`http://localhost:3000/t/${teamId}`);
    expect(screen.getByRole('button', { name: text.share.copied })).toBeInTheDocument();
  });

  it('TeamPage_JustCreated_PutsTheLinkToShareFirst', async () => {
    const teamId = await createTeam(['Anna']);

    renderApp(`/t/${teamId}?created`);

    const hint = await screen.findByText(text.share.created);
    const presenter = screen.getByText('Anna', { selector: 'p' });
    expect(hint.compareDocumentPosition(presenter) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('TeamPage_OthersChangeTheQueue_ShowsItWhenThePageIsSeenAgain', async () => {
    const teamId = await createTeam(['Anna', 'Bartek']);
    renderApp(`/t/${teamId}`);
    expect(await queueNames()).toEqual(['Anna', 'Bartek']);

    await changePeopleElsewhere(teamId, ['Bartek', 'Anna']);
    act(() => {
      window.dispatchEvent(new Event('visibilitychange'));
    });

    await vi.waitFor(async () => expect(await queueNames()).toEqual(['Bartek', 'Anna']));
  });
});
