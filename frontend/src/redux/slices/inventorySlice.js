import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchInventory as fetchInventoryAPI } from "../../services/inventoryService";

const initialState = {
  data: [],
  loading: false,
  error: null,
  selectedItem: null,
  lastUpdated: null,
  filters: {
    search: "",
    category: "all",
    sortBy: "name",
  },
};

export const fetchInventory = createAsyncThunk(
  "inventory/fetchInventory",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchInventoryAPI();
      return response;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch inventory");
    }
  }
);

const inventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {
    setSelectedItem: (state, action) => {
      state.selectedItem = action.payload;
    },
    setSearchFilter: (state, action) => {
      state.filters.search = action.payload;
    },
    setCategoryFilter: (state, action) => {
      state.filters.category = action.payload;
    },
    setSortBy: (state, action) => {
      state.filters.sortBy = action.payload;
    },
    clearInventory: (state) => {
      state.data = [];
      state.selectedItem = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setSelectedItem,
  setSearchFilter,
  setCategoryFilter,
  setSortBy,
  clearInventory,
} = inventorySlice.actions;

export default inventorySlice.reducer;
