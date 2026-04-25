# Redux Integration Guide

## Project Structure

The new Redux-integrated folder structure provides production-grade scalability:

```
src/
├── redux/
│   ├── store/
│   │   └── index.js              # Redux store configuration
│   ├── slices/
│   │   ├── customersSlice.js     # Customers state & reducers
│   │   ├── billsSlice.js         # Bills state & reducers
│   │   ├── inventorySlice.js     # Inventory state & reducers
│   │   ├── suppliersSlice.js     # Suppliers state & reducers
│   │   ├── uiSlice.js            # UI state & reducers
│   │   └── authSlice.js          # Auth state & reducers
│   ├── selectors/
│   │   ├── customerSelectors.js  # Customer state selectors
│   │   ├── billSelectors.js      # Bill state selectors
│   │   ├── inventorySelectors.js # Inventory state selectors
│   │   ├── supplierSelectors.js  # Supplier state selectors
│   │   ├── uiSelectors.js        # UI state selectors
│   │   └── authSelectors.js      # Auth state selectors
│   └── middleware/               # Custom middleware (expandable)
├── services/
│   ├── customerService.js        # Customer API calls
│   ├── billService.js            # Bill API calls
│   ├── inventoryService.js       # Inventory API calls
│   └── supplierService.js        # Supplier API calls
├── hooks/
│   └── useRedux.js              # Custom Redux hooks
├── constants/
│   └── index.js                 # App constants
├── utils/
│   └── reduxUtils.js            # Redux utility functions
└── types/                        # TypeScript types (optional)
```

## Core Concepts

### 1. Redux Slices
Each feature has its own slice using Redux Toolkit's `createSlice`:
- **State**: Initial state with data, loading, error, and filters
- **Reducers**: Synchronous state updates
- **Extra Reducers**: Handle async thunks (pending, fulfilled, rejected)

### 2. Async Thunks
Async operations are handled using `createAsyncThunk`:
```javascript
export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchCustomersAPI();
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
```

### 3. Selectors
Selectors provide a clean API for accessing state:
```javascript
export const selectCustomers = (state) => state.customers.data;
export const selectFilteredCustomers = (state) => {
  // Complex derived state
};
```

### 4. Services
Service files wrap API calls and are used by thunks:
```javascript
export const fetchCustomers = async (params) => {
  const data = await apiClient.getCustomers(params);
  return data;
};
```

## Usage Examples

### In Components

#### Using Custom Hooks (Recommended)
```javascript
import { useCustomers } from '../hooks/useRedux';
import { useAppDispatch } from '../hooks/useRedux';
import { fetchCustomers } from '../redux/slices/customersSlice';

function MyComponent() {
  const dispatch = useAppDispatch();
  const { customers, loading, error } = useCustomers();

  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {customers.map(c => <div key={c.id}>{c.name}</div>)}
    </div>
  );
}
```

#### Using Selectors Directly
```javascript
import { useAppSelector } from '../hooks/useRedux';
import { selectFilteredCustomers } from '../redux/selectors/customerSelectors';

function MyComponent() {
  const filteredCustomers = useAppSelector(selectFilteredCustomers);
  
  return (
    <div>
      {filteredCustomers.map(c => <div key={c.id}>{c.name}</div>)}
    </div>
  );
}
```

### Dispatching Actions

#### Reducers
```javascript
import { setSelectedCustomer } from '../redux/slices/customersSlice';

dispatch(setSelectedCustomer(customer));
```

#### Async Thunks
```javascript
import { fetchCustomers } from '../redux/slices/customersSlice';

dispatch(fetchCustomers());
```

## Store Structure

```javascript
{
  customers: {
    data: [],
    loading: false,
    error: null,
    selectedCustomer: null,
    lastUpdated: null,
    filters: { search: '', sortBy: 'name' }
  },
  bills: {
    data: [],
    loading: false,
    error: null,
    selectedBill: null,
    lastUpdated: null,
    filters: { search: '', status: 'all', sortBy: 'date' }
  },
  inventory: { /* similar structure */ },
  suppliers: { /* similar structure */ },
  ui: {
    sidebarOpen: true,
    theme: 'light',
    notifications: [],
    modals: { /* various modal states */ },
    loading: false
  },
  auth: {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    token: null
  }
}
```

## Best Practices

### 1. Use Selectors
```javascript
// ✓ Good - memoized and reusable
const customers = useAppSelector(selectFilteredCustomers);

// ✗ Avoid - causes unnecessary re-renders
const customers = useAppSelector(state => 
  state.customers.data.filter(...)
);
```

### 2. Keep Slices Focused
Each slice handles one feature:
- Customers slice: only customer state
- Bills slice: only bill state
- etc.

### 3. Use Services for API Calls
```javascript
// ✓ Good - centralized API logic
const response = await fetchCustomersAPI();

// ✗ Avoid - mixing concerns
const response = await apiClient.getCustomers();
```

### 4. Normalize Data When Needed
For large datasets, consider normalizing:
```javascript
const { byId, ids } = normalizeData(customers);
```

### 5. Cache Data Efficiently
Check if data is stale before fetching:
```javascript
const shouldRefresh = isDataStale(lastUpdated, 5 * 60 * 1000);
```

## Common Patterns

### Loading State
```javascript
function Component() {
  const dispatch = useAppDispatch();
  const { customers, loading } = useCustomers();

  useEffect(() => {
    if (!loading) dispatch(fetchCustomers());
  }, []);

  if (loading) return <LoadingSpinner />;
  return <CustomerList customers={customers} />;
}
```

### Error Handling
```javascript
function Component() {
  const { customers, error } = useCustomers();

  if (error) return <ErrorMessage message={error} />;
  return <CustomerList customers={customers} />;
}
```

### Filtering
```javascript
const dispatch = useAppDispatch();

const handleSearch = (query) => {
  dispatch(setSearchFilter(query));
};
```

### Modal Management
```javascript
const dispatch = useAppDispatch();

const handleDelete = (id) => {
  dispatch(openModal('confirmDelete'));
};
```

## Performance Optimization

1. **Memoization**: Selectors automatically memoize results
2. **Deferred Loading**: Load data on-demand, not on app start
3. **Data Normalization**: For large datasets, normalize and index by ID
4. **Lazy Loading**: Load pages/features as needed
5. **Middleware**: Add caching middleware for frequently accessed data

## Migration Guide

To migrate existing components to Redux:

1. Create/update the slice for that feature
2. Create selectors for the slice
3. Create a service for API calls
4. Update component to use `useAppSelector` and `useAppDispatch`
5. Replace any local state with Redux state
6. Test thoroughly

## Scalability Features

✓ **Modular**: Add new features by creating new slices
✓ **Type-safe**: Ready for TypeScript migration
✓ **Performance**: Selectors prevent unnecessary re-renders
✓ **Middleware Ready**: Easy to add custom middleware
✓ **Dev Tools**: Redux DevTools integration included
✓ **Async Handling**: Built-in async/await support

## Testing

Ready for testing:
- Pure reducers: easy to unit test
- Selectors: easy to test isolation
- Thunks: test with mock services
- Components: mock Redux with `@testing-library`

## Next Steps

1. **Update existing pages** to use Redux instead of local state
2. **Add React Query integration** for caching strategies
3. **Migrate to TypeScript** for type safety
4. **Add Redux Persist** for local storage
5. **Implement custom middleware** for logging/analytics
