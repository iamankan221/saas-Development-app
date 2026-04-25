import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchBills as fetchBillsAPI } from "../../services/billService";

const initialState = {
  data: [],
  loading: false,
  error: null,
  selectedBill: null,
  lastUpdated: null,
  filters: {
    search: "",
    status: "all",
    sortBy: "date",
  },
};

export const fetchBills = createAsyncThunk(
  "bills/fetchBills",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchBillsAPI();
      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch bills");
    }
  }
);

const billsSlice = createSlice({
  name: "bills",
  initialState,
  reducers: {
    setSelectedBill: (state, action) => {
      state.selectedBill = action.payload;
    },
    setSearchFilter: (state, action) => {
      state.filters.search = action.payload;
    },
    setStatusFilter: (state, action) => {
      state.filters.status = action.payload;
    },
    setSortBy: (state, action) => {
      state.filters.sortBy = action.payload;
    },
    clearBills: (state) => {
      state.data = [];
      state.selectedBill = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBills.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBills.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchBills.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setSelectedBill,
  setSearchFilter,
  setStatusFilter,
  setSortBy,
  clearBills,
} = billsSlice.actions;

export default billsSlice.reducer;
