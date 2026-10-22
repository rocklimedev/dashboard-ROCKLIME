import { useAuth } from '../../context/AuthContext';
import {
  useGetPlanningRecordsQuery,
  useSavePlanningRecordMutation,
  useDeletePlanningRecordMutation,
} from '../../api/planningApi';

export default function usePlanning() {
  const { auth } = useAuth();
  const owner = auth?.user?.userId || auth?.user?.id || auth?.user?.email;
  const options = { skip: !owner, refetchOnMountOrArgChange: true, refetchOnFocus: true };
  const tasksQuery = useGetPlanningRecordsQuery({ collection: 'tasks', owner }, options);
  const eventsQuery = useGetPlanningRecordsQuery({ collection: 'events', owner }, options);
  const [saveRecord, saveState] = useSavePlanningRecordMutation();
  const [deleteRecord, deleteState] = useDeletePlanningRecordMutation();
  const error = tasksQuery.error || eventsQuery.error;
  const normalize = (err) =>
    new Error(
      err?.data?.message || err?.error || 'Could not save planning data. Please try again.',
    );
  return {
    tasks: tasksQuery.currentData || [],
    events: eventsQuery.currentData || [],
    ready:
      Boolean(owner) &&
      tasksQuery.isSuccess &&
      eventsQuery.isSuccess &&
      !error &&
      !tasksQuery.isFetching &&
      !eventsQuery.isFetching &&
      !saveState.isLoading &&
      !deleteState.isLoading,
    saving: saveState.isLoading || deleteState.isLoading,
    error: error
      ? error.data?.message || 'Could not load planning data. Please refresh to retry.'
      : null,
    async save(collection, values, previous) {
      try {
        return await saveRecord({
          collection,
          owner,
          values,
          id: previous?.id,
          version: previous?.version,
        }).unwrap();
      } catch (err) {
        throw normalize(err);
      }
    },
    async remove(collection, previous) {
      try {
        await deleteRecord({
          collection,
          owner,
          id: previous.id,
          version: previous.version,
        }).unwrap();
      } catch (err) {
        throw normalize(err);
      }
    },
  };
}
