import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../../test/renderApp';
import { nameInput, queueNames, typedNames, typeNames } from '../../test/screens';
import { text } from '../../text';

describe('CreateTeamPage', () => {
  it('CreateTeam_NamesTyped_ShowsTeamWithLinkToShare', async () => {
    const { user } = renderApp('/');
    await typeNames(user, ['Anna', 'Bartek']);

    await user.click(screen.getByRole('button', { name: text.create.submit }));

    expect(await screen.findByText(text.share.created)).toBeInTheDocument();
    expect(await queueNames()).toEqual(['Anna', 'Bartek']);
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: text.share.linkLabel }).value)
      .toMatch(/^http:\/\/localhost:3000\/t\/[A-Za-z0-9_-]{22}$/);
  });

  it('CreateTeam_NoNames_ShowsWhyNot', async () => {
    const { user } = renderApp('/');

    await user.click(screen.getByRole('button', { name: text.create.submit }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Add at least one name.');
  });

  it('CreateTeam_ArrowsMoveNames_TeamIsCreatedInThatOrder', async () => {
    const { user } = renderApp('/');
    await typeNames(user, ['Anna', 'Bartek', 'Celina']);

    await user.click(screen.getByRole('button', { name: text.people.moveDown('Anna') }));
    await user.click(screen.getByRole('button', { name: text.people.moveUp('Celina') }));
    await user.click(screen.getByRole('button', { name: text.create.submit }));

    expect(await queueNames()).toEqual(['Bartek', 'Celina', 'Anna']);
  });

  it('CreateTeam_ArrowPressedAgain_KeepsFocusOnTheArrow', async () => {
    const { user } = renderApp('/');
    await typeNames(user, ['Anna', 'Bartek', 'Celina']);

    await user.click(screen.getByRole('button', { name: text.people.moveDown('Anna') }));
    await user.keyboard('{Enter}');

    expect(typedNames()).toEqual(['Bartek', 'Celina', 'Anna', '']);
    expect(screen.getByRole('button', { name: text.people.moveDown('Anna') })).toHaveFocus();
  });

  it('CreateTeam_ArrowsAtTheEnds_LeaveTheOrderAlone', async () => {
    const { user } = renderApp('/');
    await typeNames(user, ['Anna', 'Bartek']);
    const firstUp = screen.getByRole('button', { name: text.people.moveUp('Anna') });
    const lastDown = screen.getByRole('button', { name: text.people.moveDown('Bartek') });

    await user.click(firstUp);
    await user.click(lastDown);

    expect(firstUp).toHaveAttribute('aria-disabled', 'true');
    expect(lastDown).toHaveAttribute('aria-disabled', 'true');
    expect(typedNames()).toEqual(['Anna', 'Bartek', '']);
  });

  it('CreateTeam_ListPasted_FillsARowPerLine', async () => {
    const { user } = renderApp('/');
    await user.click(nameInput(0));

    await user.paste('Anna\nBartek\tteam lead\nCelina');

    expect(typedNames()).toEqual(['Anna', 'Bartek', 'Celina', '']);
    expect(nameInput(3)).toHaveFocus();
  });

  it('CreateTeam_EnterInAName_GoesToTheNextRowWithoutCreating', async () => {
    const { user } = renderApp('/');
    await typeNames(user, ['Anna']);

    await user.type(nameInput(0), '{Enter}');

    expect(nameInput(1)).toHaveFocus();
    expect(screen.queryByText(text.share.created)).not.toBeInTheDocument();
  });

  it('CreateTeam_NameRemoved_FocusesTheRowThatTookItsPlace', async () => {
    const { user } = renderApp('/');
    await typeNames(user, ['Anna', 'Bartek', 'Celina']);

    await user.click(screen.getByRole('button', { name: text.people.remove('Bartek') }));

    expect(typedNames()).toEqual(['Anna', 'Celina', '']);
    expect(nameInput(1)).toHaveFocus();
  });
});
