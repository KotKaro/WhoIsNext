import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useTeam } from '../../api/teams';
import { text } from '../../text';
import { HistoryCard } from './HistoryCard';
import { PresenterCard } from './PresenterCard';
import { QueueCard } from './QueueCard';
import { ShareCard } from './ShareCard';

export function TeamPage() {
  const { teamId = '' } = useParams();
  const team = useTeam(teamId);
  const justCreated = useJustCreated();
  const presenter = team.data?.queue[0]?.name;

  useEffect(() => {
    if (presenter) document.title = text.presenter.documentTitle(presenter);
  }, [presenter]);

  // After the first load a failed refresh keeps what is shown; the next refresh tries again.
  if (team.data) {
    const share = <ShareCard teamId={teamId} justCreated={justCreated} />;
    return (
      <section>
        {justCreated && share}
        <PresenterCard team={team.data} />
        <QueueCard teamId={teamId} team={team.data} />
        <HistoryCard history={team.data.history} />
        {!justCreated && share}
      </section>
    );
  }
  if (team.error) {
    return (
      <>
        <p className="muted">{team.error.message}</p>
        <p><Link to="/">{text.createNewTeam}</Link></p>
      </>
    );
  }
  return <p className="muted">{text.loading}</p>;
}

// A team just created arrives with ?created; the link to share comes first, then the address is tidied.
function useJustCreated() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [justCreated] = useState(() => searchParams.has('created'));

  useEffect(() => {
    if (searchParams.has('created')) setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  return justCreated;
}
