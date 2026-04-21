import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { Assets } from './pages/Assets';
import { Requests } from './pages/Requests';
import { Incidents } from './pages/Incidents';
import { Directorate } from './pages/Directorate';
import { DisposalTrail } from './pages/DisposalTrail';
import { AuditTrail } from './pages/AuditTrail';
import { AssignmentHistory } from './pages/AssignmentHistory';
import { Penalties } from './pages/Penalties';
import { ProcurementTrail } from './pages/ProcurementTrail';
import { IncidentTrail } from './pages/IncidentTrail';
import { SystemTrail } from './pages/SystemTrail';
import { RequestTrail } from './pages/RequestTrail';
import { AssetTrail } from './pages/AssetTrail';

import { Profile } from './pages/Profile';
import { Overview } from './pages/Overview';

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/overview" element={<Overview />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/directorate" element={<Directorate />} />
            <Route path="/disposal-logs" element={<DisposalTrail />} />
            <Route path="/audit-trail" element={<AuditTrail />} />
            <Route path="/asset-trail" element={<AssetTrail />} />
            <Route path="/procurement-trail" element={<ProcurementTrail />} />
            <Route path="/incident-trail" element={<IncidentTrail />} />
            <Route path="/system-trail" element={<SystemTrail />} />
            <Route path="/request-trail" element={<RequestTrail />} />
            <Route path="/assignment-history" element={<AssignmentHistory />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/penalties" element={<Penalties />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
