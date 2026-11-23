import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { callApi } from './client';
import type { TeamView } from './types';

const refreshEvery = 60_000;
const teamKey = (teamId: string) => ['team', teamId];

// Refreshes every minute while the page is visible, and when it becomes visible again,
// so an open page keeps in step with what others change.
export function useTeam(teamId: string) {
  return useQuery({
    queryKey: teamKey(teamId),
    queryFn: () => callApi<TeamView>('GET', `/api/teams/${teamId}`),
    refetchInterval: refreshEvery,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (names: string[]) => callApi<TeamView>('POST', '/api/teams', { names }),
    onSuccess: (team) => queryClient.setQueryData(teamKey(team.id), team),
  });
}

export function useChangePeople(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (names: string[]) => callApi<TeamView>('PUT', `/api/teams/${teamId}`, { names }),
    onSuccess: (team) => queryClient.setQueryData(teamKey(teamId), team),
  });
}

export function useTakeTurn(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => callApi<TeamView>('PUT', `/api/teams/${teamId}/presenter`, { name }),
    onSuccess: (team) => queryClient.setQueryData(teamKey(teamId), team),
    // The queue may have changed under us; show what it is now.
    onError: () => queryClient.invalidateQueries({ queryKey: teamKey(teamId) }),
  });
}
