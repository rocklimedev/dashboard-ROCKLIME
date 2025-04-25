// hooks/useTeamDataMap.js
import { useMemo } from "react";
import { useGetTeamByIdQuery } from "../api/teamApi";

export const useTeamDataMap = (teamIds) => {
  // Fetch data for multiple teams using the new query
  const { data, isLoading } = useGetTeamByIdQuery(teamIds, {
    skip: !teamIds?.length, // Skip the query if no team IDs are provided
  });

  // Memoize the map to avoid recalculating it on every render
  const map = useMemo(() => {
    const teamMap = {};

    // If data is available, populate the map with team info
    if (data) {
      data.forEach((team) => {
        teamMap[team.id] = {
          teamName: team.name,
          isLoading: false,
        };
      });
    }

    // For any IDs not in the fetched data, set them as "Unassigned"
    teamIds.forEach((id) => {
      if (!teamMap[id]) {
        teamMap[id] = {
          teamName: "Unassigned",
          isLoading,
        };
      }
    });

    return teamMap;
  }, [data, isLoading, teamIds]); // Dependencies: only recalculate when data, loading state, or teamIds change

  return map;
};
