import { Navigate, Route, Routes } from 'react-router';
import { CreateTeamPage } from './features/create/CreateTeamPage';
import { TeamPage } from './features/team/TeamPage';
import { text } from './text';

export function App() {
  return (
    <main>
      <h1>{text.appName}</h1>
      <Routes>
        <Route path="/" element={<CreateTeamPage />} />
        <Route path="/t/:teamId" element={<TeamPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}
