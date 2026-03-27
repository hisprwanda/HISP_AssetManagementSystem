import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';

const DashboardHome = () => (
  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
    <h2 className="text-2xl font-bold text-slate-800 mb-2">System Overview</h2>
    <p className="text-slate-600">
      Welcome to the HISP Rwanda Asset Management System. Select a module from
      the sidebar to begin.
    </p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardHome />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
