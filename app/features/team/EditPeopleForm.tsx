import type { FormEvent } from 'react';
import { useChangePeople } from '../../api/teams';
import { text } from '../../text';
import { PeopleFields } from '../people/PeopleFields';
import { usePeopleRows } from '../people/usePeopleRows';

interface EditPeopleFormProps {
  teamId: string;
  names: string[];
  onClose: () => void;
}

// Starts from the queue as it was when opened; refreshes while editing leave the rows alone.
export function EditPeopleForm({ teamId, names, onClose }: EditPeopleFormProps) {
  const people = usePeopleRows(names, { focusFirst: true });
  const changePeople = useChangePeople(teamId);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    changePeople.mutate(people.names(), { onSuccess: onClose });
  }

  return (
    <form onSubmit={onSubmit}>
      <PeopleFields legend={text.queue.editLegend} people={people} />
      {changePeople.error && <p className="error" role="alert">{changePeople.error.message}</p>}
      <div className="actions">
        <button className="primary" type="submit" disabled={changePeople.isPending}>{text.queue.save}</button>
        <button type="button" onClick={onClose}>{text.queue.cancel}</button>
      </div>
    </form>
  );
}
