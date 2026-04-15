import { Routes, Route } from 'react-router-dom';
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

import { Profile } from './pages/Profile';
import { Overview } from './pages/Overview';

function App() {
  return (
    <AuthProvider>
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
