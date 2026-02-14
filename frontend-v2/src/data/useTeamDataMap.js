// hooks/useTeamDataMap.js
import { useMemo } from "react";
import { useGetTeamByIdQuery } from "../api/teamApi";

export const useTeamDataMap = (teamIds) => {
  // Ensure teamIds is an array
  const validTeamIds = Array.isArray(teamIds) ? teamIds : [];

  // Fetch data for multiple teams using the query
  const { data, isLoading } = useGetTeamByIdQuery(validTeamIds, {
    skip: !validTeamIds?.length, // Skip the query if no team IDs are provided
  });

  // Memoize the map to avoid recalculating it on every render
  const map = useMemo(() => {
    const teamMap = {};

    // Ensure data is an array before iterating
    if (Array.isArray(data)) {
      data.forEach((team) => {
        teamMap[team.id] = {
          teamName: team.name || "Unknown Team",
          isLoading: false,
        };
      });
    }

    // For any IDs not in the fetched data, set them as "Unassigned"
    validTeamIds.forEach((id) => {
      if (!teamMap[id]) {
        teamMap[id] = {
          teamName: "Unassigned",
          isLoading,
        };
      }
    });

    return teamMap;
  }, [data, isLoading, validTeamIds]); // Dependencies: only recalculate when data, loading state, or teamIds change

  return map;
};
