import { useAuth } from '@services/useApi';

export default function LoginComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  const handleLogin = async () => {
    const success = await login({
      email: 'user@example.com',
      password: 'password123'
    });
    
    if (success) {
      console.log('Logged in:', user);
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome, {user?.name}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
