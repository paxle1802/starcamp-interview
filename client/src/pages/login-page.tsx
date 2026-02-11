import { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useAuth } from '../contexts/auth-context';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--bg-primary);
`;

const Card = styled.div`
  background: var(--bg-secondary);
  padding: 44px 40px;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  width: 420px;
  animation: ${fadeIn} 0.5s ease-out;
`;

const Logo = styled.div`
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--text-primary);
  margin-bottom: 4px;
`;

const Subtitle = styled.p`
  color: var(--text-tertiary);
  font-size: 15px;
  margin-bottom: 32px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 15px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  outline: none;
  transition: all var(--transition);

  &:focus {
    border-color: var(--border-focused);
    background: var(--bg-secondary);
    box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.12);
  }

  &::placeholder { color: var(--text-tertiary); }
`;

const Button = styled.button`
  padding: 12px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all var(--transition);
  margin-top: 4px;

  &:hover { background: var(--accent-hover); transform: scale(1.01); }
  &:active { transform: scale(0.99); }
  &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
`;

const Toggle = styled.p`
  text-align: center;
  margin-top: 20px;
  color: var(--text-tertiary);
  font-size: 14px;

  span {
    color: var(--accent);
    cursor: pointer;
    font-weight: 600;
    transition: opacity var(--transition);
    &:hover { opacity: 0.8; }
  }
`;

const ErrorMsg = styled.p`
  color: var(--red);
  font-size: 13px;
  margin: 0;
  padding: 10px 14px;
  background: var(--red-light);
  border-radius: var(--radius-sm);
`;

export const LoginPage = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response: { data: { error: string } } }).response?.data?.error
        : 'Something went wrong';
      setError(msg || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Card>
        <Logo>Starcamp</Logo>
        <Subtitle>{isRegister ? 'Create your account' : 'Sign in to continue'}</Subtitle>
        <Form onSubmit={handleSubmit}>
          {isRegister && (
            <Input
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          {error && <ErrorMsg>{error}</ErrorMsg>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
          </Button>
        </Form>
        <Toggle>
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <span onClick={() => { setIsRegister(!isRegister); setError(''); }}>
            {isRegister ? 'Sign In' : 'Create Account'}
          </span>
        </Toggle>
      </Card>
    </Container>
  );
};
