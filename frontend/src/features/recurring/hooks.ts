import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  createRecurringPayment,
  deleteRecurringPayment,
  fetchRecurringExecutions,
  fetchRecurringPayments,
  pauseRecurringPayment,
  resumeRecurringPayment,
  updateRecurringPayment,
} from "./api";
import type { RecurringUpdatePayload } from "./types";
import { fetchAccounts } from "@/features/accounts/api";
import { fetchCategories } from "@/features/categories/api";

export const recurringKeys = {
  all: ["recurring"] as const,
  list: () => [...recurringKeys.all, "list"] as const,
  executions: (id: string, page: number) =>
    [...recurringKeys.all, "executions", id, page] as const,
};

export const useRecurringPayments = () =>
  useQuery({
    queryKey: recurringKeys.list(),
    queryFn: () => fetchRecurringPayments(),
  });

export const useRecurringExecutions = (id: string | null, page: number) =>
  useQuery({
    queryKey: recurringKeys.executions(id ?? "", page),
    queryFn: () => fetchRecurringExecutions(id as string, page),
    enabled: id !== null,
    placeholderData: keepPreviousData,
  });

function useRecurringMutation<TVars, TData>(
  fn: (vars: TVars) => Promise<TData>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: recurringKeys.all }),
  });
}

export const useCreateRecurring = () =>
  useRecurringMutation(createRecurringPayment);

export const useUpdateRecurring = () =>
  useRecurringMutation(
    ({ id, input }: { id: string; input: RecurringUpdatePayload }) =>
      updateRecurringPayment(id, input),
  );

export const useAccountOptions = () =>
  useQuery({
    queryKey: ["recurring-options", "accounts"],
    queryFn: () => fetchAccounts(false),
  });

export const useCategoryOptions = () =>
  useQuery({
    queryKey: ["recurring-options", "categories"],
    queryFn: () => fetchCategories(false),
  });

export const usePauseRecurring = () =>
  useRecurringMutation(pauseRecurringPayment);
export const useResumeRecurring = () =>
  useRecurringMutation(resumeRecurringPayment);
export const useDeleteRecurring = () =>
  useRecurringMutation(deleteRecurringPayment);
