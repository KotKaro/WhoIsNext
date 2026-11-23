import type { FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useCreateTeam } from '../../api/teams';
import { text } from '../../text';
import { PeopleFields } from '../people/PeopleFields';
import { usePeopleRows } from '../people/usePeopleRows';

export function CreateTeamPage() {
  const people = usePeopleRows([]);
  const createTeam = useCreateTeam();
  const navigate = useNavigate();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createTeam.mutate(people.names(), {
      onSuccess: (team) => navigate(`/t/${team.id}?created`),
    });
  }

  return (
    <section className="card">
      <p>{text.create.intro}</p>
      <form onSubmit={onSubmit}>
        <PeopleFields legend={text.create.legend} people={people} />
        {createTeam.error && <p className="error" role="alert">{createTeam.error.message}</p>}
        <div className="actions">
          <button className="primary" type="submit" disabled={createTeam.isPending}>{text.create.submit}</button>
        </div>
      </form>
    </section>
  );
}
