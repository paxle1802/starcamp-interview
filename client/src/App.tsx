import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { AuthProvider, useAuth } from './contexts/auth-context';
import { LoginPage } from './pages/login-page';
import { QuestionBankPage } from './pages/question-bank-page';
import { InterviewSetupPage } from './pages/interview-setup-page';
import { LiveInterviewPage } from './pages/live-interview-page';
import { InterviewListPage } from './pages/interview-list-page';
import { InterviewResultsPage } from './pages/interview-results-page';

const Nav = styled.nav`
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg-glass);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid var(--border);
  padding: 0 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 52px;
`;

const NavTitle = styled.h2`
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.2px;
  color: var(--text-primary);
`;

const NavLinks = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

const NavLink = styled(Link)<{ $active?: boolean }>`
  color: ${({ $active }) => $active ? 'var(--accent)' : 'var(--text-secondary)'};
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  transition: all var(--transition);
  background: ${({ $active }) => $active ? 'var(--accent-light)' : 'transparent'};

  &:hover {
    color: var(--accent);
    background: var(--accent-light);
  }
`;

const UserName = styled.span`
  font-size: 13px;
  color: var(--text-tertiary);
  margin-left: 8px;
`;

const LogoutBtn = styled.button`
  background: none;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 5px 14px;
  border-radius: 980px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  margin-left: 12px;
  transition: all var(--transition);

  &:hover {
    color: var(--red);
    border-color: var(--red);
    background: var(--red-light);
  }
`;

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen>Loading...</LoadingScreen>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

const LoadingScreen = styled.p`
  text-align: center;
  padding: 80px;
  color: var(--text-tertiary);
  font-size: 15px;
`;

const NavBar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  return (
    <Nav>
      <NavTitle>Starcamp</NavTitle>
      <NavLinks>
        <NavLink to="/questions" $active={location.pathname === '/questions'}>
          Questions
        </NavLink>
        <NavLink to="/interviews" $active={location.pathname.startsWith('/interviews')}>
          Interviews
        </NavLink>
        <UserName>{user.name}</UserName>
        <LogoutBtn onClick={logout}>Sign Out</LogoutBtn>
      </NavLinks>
    </Nav>
  );
};

const AppContent = () => {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/questions" /> : <LoginPage />} />
        <Route path="/questions" element={
          <ProtectedRoute><QuestionBankPage /></ProtectedRoute>
        } />
        <Route path="/interviews/new" element={
          <ProtectedRoute><InterviewSetupPage /></ProtectedRoute>
        } />
        <Route path="/interviews/:id/live" element={
          <ProtectedRoute><LiveInterviewPage /></ProtectedRoute>
        } />
        <Route path="/interviews/:id/results" element={
          <ProtectedRoute><InterviewResultsPage /></ProtectedRoute>
        } />
        <Route path="/interviews" element={
          <ProtectedRoute><InterviewListPage /></ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/questions" />} />
      </Routes>
    </BrowserRouter>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
