import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { Layout } from "./components/Layout";
import { AuthGuard } from "./components/AuthGuard";
import { UnauthGuard } from "./components/UnauthGuard";
import { Snackbar } from "./components/Snackbar";
import Dashboard       from "./pages/Dashboard";
import Customers       from "./pages/Customers";
import CustomerDetail  from "./pages/CustomerDetail";
import Bills           from "./pages/Bills";
import NewBill         from "./pages/NewBill";
import BillDetail      from "./pages/BillDetail";
import Inventory       from "./pages/Inventory";
import InventoryDetail from "./pages/InventoryDetail";
import Suppliers       from "./pages/Suppliers";
import SupplierDetail  from "./pages/SupplierDetail";
import Analytics       from "./pages/Analytics";
import Settings        from "./pages/Settings";
import Login           from "./pages/Login";
import Register        from "./pages/Register";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function Router() {
  return (
    <Switch>
      {/* Public routes — wrapped in UnauthGuard */}
      <Route path="/login">
        <UnauthGuard><Login /></UnauthGuard>
      </Route>
      <Route path="/register">
        <UnauthGuard><Register /></UnauthGuard>
      </Route>

      {/* Protected routes — wrapped in AuthGuard + Layout */}
      <Route>
        <AuthGuard>
          <Layout>
            <Switch>
              <Route path="/"                component={Dashboard} />
              <Route path="/customers"       component={Customers} />
              <Route path="/customers/:id"   component={CustomerDetail} />
              <Route path="/bills/new"       component={NewBill} />
              <Route path="/bills/:id"       component={BillDetail} />
              <Route path="/bills"           component={Bills} />
              <Route path="/inventory/:id"   component={InventoryDetail} />
              <Route path="/inventory"       component={Inventory} />
              <Route path="/suppliers/:id"   component={SupplierDetail} />
              <Route path="/suppliers"       component={Suppliers} />
              <Route path="/analytics"       component={Analytics} />
              <Route path="/settings"        component={Settings} />
              <Route>
                <div className="text-center py-20">
                  <h2 className="text-xl font-bold text-gray-700">404 — Page not found</h2>
                </div>
              </Route>
            </Switch>
          </Layout>
        </AuthGuard>
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Snackbar />
    </QueryClientProvider>
  );
}
