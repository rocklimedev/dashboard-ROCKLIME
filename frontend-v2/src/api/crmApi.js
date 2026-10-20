import { baseApi } from "../store/baseApi";

const qs = (params = {}) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== null && v !== "" && p.set(k, v));
  const s = p.toString();
  return s ? `?${s}` : "";
};

// CRM app (pipeline, follow-ups) and its Zoho Bigin link
export const crmApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCrmMeta: builder.query({ query: () => `/crm/meta`, providesTags: ["Crm"] }),
    getCrmBoard: builder.query({ query: (params) => `/crm/board${qs(params)}`, providesTags: ["Crm"] }),
    getCrmDeals: builder.query({ query: (params) => `/crm/deals${qs(params)}`, providesTags: ["Crm"] }),
    getCrmDeal: builder.query({ query: (id) => `/crm/deals/${id}`, providesTags: (r, e, id) => ["Crm", { type: "Crm", id }] }),
    getCustomerDeals: builder.query({ query: (customerId) => `/crm/customer/${customerId}`, providesTags: ["Crm"] }),
    getCrmTasks: builder.query({ query: (params) => `/crm/tasks${qs(params)}`, providesTags: ["Crm"] }),
    createDeal: builder.mutation({
      query: (body) => ({ url: `/crm/deals`, method: "POST", body }),
      invalidatesTags: ["Crm"],
    }),
    updateDeal: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/crm/deals/${id}`, method: "PUT", body }),
      invalidatesTags: ["Crm"],
    }),
    moveDeal: builder.mutation({
      query: ({ id, stage, lostReason }) => ({ url: `/crm/deals/${id}/stage`, method: "PUT", body: { stage, lostReason } }),
      // the board moves the card straight away; the server answer confirms it
      async onQueryStarted({ id, stage, boardArgs }, { dispatch, queryFulfilled }) {
        if (boardArgs === undefined) return;
        const patch = dispatch(
          crmApi.util.updateQueryData("getCrmBoard", boardArgs, (draft) => {
            let card;
            for (const s of Object.keys(draft.columns)) {
              const i = draft.columns[s].findIndex((d) => d.id === id);
              if (i >= 0) {
                [card] = draft.columns[s].splice(i, 1);
                draft.totals[s].count -= 1;
                draft.totals[s].amount -= card.amount || 0;
              }
            }
            if (card && draft.columns[stage]) {
              card.stage = stage;
              card.daysInStage = 0;
              draft.columns[stage].unshift(card);
              draft.totals[stage].count += 1;
              draft.totals[stage].amount += card.amount || 0;
            }
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: ["Crm"],
    }),
    deleteDeal: builder.mutation({ query: (id) => ({ url: `/crm/deals/${id}`, method: "DELETE" }), invalidatesTags: ["Crm"] }),
    addDealNote: builder.mutation({
      query: ({ id, text, kind }) => ({ url: `/crm/deals/${id}/notes`, method: "POST", body: { text, kind } }),
      invalidatesTags: ["Crm"],
    }),
    addDealTask: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/crm/deals/${id}/tasks`, method: "POST", body }),
      invalidatesTags: ["Crm"],
    }),
    updateDealTask: builder.mutation({
      query: ({ taskId, ...body }) => ({ url: `/crm/tasks/${taskId}`, method: "PUT", body }),
      invalidatesTags: ["Crm"],
    }),
    deleteDealTask: builder.mutation({ query: (taskId) => ({ url: `/crm/tasks/${taskId}`, method: "DELETE" }), invalidatesTags: ["Crm"] }),
    dealCustomer: builder.mutation({
      query: (id) => ({ url: `/crm/deals/${id}/customer`, method: "POST" }),
      invalidatesTags: ["Crm", "Customers"],
    }),
    linkDealQuotation: builder.mutation({
      query: ({ id, quotationId }) => ({ url: `/crm/deals/${id}/quotation`, method: "POST", body: { quotationId } }),
      invalidatesTags: ["Crm"],
    }),
    // Bigin
    getBiginStatus: builder.query({ query: () => `/zoho/bigin/status`, providesTags: ["Crm", "Zoho"] }),
    getBiginPipelines: builder.query({ query: () => `/zoho/bigin/pipelines`, providesTags: ["Zoho"] }),
    biginSync: builder.mutation({
      query: (body = {}) => ({ url: `/zoho/bigin/sync`, method: "POST", body }),
      invalidatesTags: ["Crm"],
    }),
    biginPush: builder.mutation({ query: (id) => ({ url: `/zoho/bigin/push/${id}`, method: "POST" }), invalidatesTags: ["Crm"] }),
  }),
});

export const {
  useGetCrmMetaQuery,
  useGetCrmBoardQuery,
  useGetCrmDealsQuery,
  useGetCrmDealQuery,
  useGetCustomerDealsQuery,
  useGetCrmTasksQuery,
  useCreateDealMutation,
  useUpdateDealMutation,
  useMoveDealMutation,
  useDeleteDealMutation,
  useAddDealNoteMutation,
  useAddDealTaskMutation,
  useUpdateDealTaskMutation,
  useDeleteDealTaskMutation,
  useDealCustomerMutation,
  useLinkDealQuotationMutation,
  useGetBiginStatusQuery,
  useGetBiginPipelinesQuery,
  useBiginSyncMutation,
  useBiginPushMutation,
} = crmApi;
