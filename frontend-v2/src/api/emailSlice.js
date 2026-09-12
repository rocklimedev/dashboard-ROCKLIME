import { createSlice } from "@reduxjs/toolkit";

const emailSlice = createSlice({
  name: "email",
  initialState: {
    activeCategory: "Inbox",
    selectedEmails: [],
  },
  reducers: {
    setActiveCategory(state, action) {
      state.activeCategory = action.payload;
    },
    toggleEmailSelection(state, action) {
      const emailId = action.payload;
      if (state.selectedEmails.includes(emailId)) {
        state.selectedEmails = state.selectedEmails.filter(
          (id) => id !== emailId
        );
      } else {
        state.selectedEmails.push(emailId);
      }
    },
  },
});

export const { setActiveCategory, toggleEmailSelection } = emailSlice.actions;
export default emailSlice.reducer;
