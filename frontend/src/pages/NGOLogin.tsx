import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth';
import { authApi } from '@/lib/api';

const NGOLogin = () => {
  const navigate = useNavigate();
  const auth = getAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);

      // 1️⃣ Firebase email/password login
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // 2️⃣ Get ID token
      const token = await cred.user.getIdToken();

      // 3️⃣ Bootstrap NGO in backend
      await authApi.bootstrap('ngo');

      // 4️⃣ Navigate
      navigate('/ngo-dashboard');
    } catch (err) {
      console.error('NGO login failed:', err);
      alert('Invalid credentials or NGO name');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container py-12">
        <div className="max-w-md mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <Card variant="elevated">
            <CardHeader className="text-center">
              <Users className="mx-auto h-8 w-8 text-success" />
              <CardTitle>NGO / Institution Login</CardTitle>
              <CardDescription>Manage book distribution</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Input
                placeholder="Organization Name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />

              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Button
                variant="success"
                className="w-full"
                disabled={loading}
                onClick={handleLogin}
              >
                {loading ? 'Logging in...' : 'Login to Dashboard'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NGOLogin;
