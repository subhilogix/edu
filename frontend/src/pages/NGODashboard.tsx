import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ActionCard from '@/components/shared/ActionCard';
import StatCard from '@/components/shared/StatCard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, Send, BarChart3, Users, BookOpen, Leaf, Loader2, Clock, CheckCircle, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { ngoApi } from '@/lib/api';

const NGODashboard = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();

  useEffect(() => {
    if (!authLoading && role === 'student') {
      navigate('/student-home');
    }
  }, [role, authLoading, navigate]);

  const orgName = profile?.organization_name || 'Organization';
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true);
        const data = await ngoApi.listBulkRequests();
        setRequests(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error loading requests:', error);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  if (profileLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header userType="ngo" />
        <main className="flex-1 container py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  // Calculate stats from requests
  const totalBooksDistributed = requests.reduce((sum, r) => sum + (r.fulfilled || 0), 0);
  const totalBooksRequested = requests.reduce((sum, r) => sum + (r.quantity || 0), 0);
  const pendingRequests = requests.filter(r => r.status === 'open').length;
  const completedRequests = requests.filter(r => r.status === 'completed').length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header userType="ngo" userName={orgName} />

      <main className="flex-1 container py-8">
        {/* Welcome */}
        <section className="mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
            Welcome, {orgName}! 🌱
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage your book collection and distribution activities
          </p>
        </section>

        {/* Quick Stats */}
        <section className="mb-10">
          <h2 className="text-xl font-display font-bold mb-6">Quick Overview</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Requests"
              value={requests.length.toString()}
              subtitle="Bulk requests"
              icon={Package}
              iconColor="text-primary"
              iconBgColor="bg-primary/10"
            />
            <StatCard
              title="Books Distributed"
              value={totalBooksDistributed.toString()}
              subtitle="Total fulfilled"
              icon={BookOpen}
              iconColor="text-secondary"
              iconBgColor="bg-secondary/20"
            />
            <StatCard
              title="Pending Requests"
              value={pendingRequests.toString()}
              subtitle="Awaiting fulfillment"
              icon={Clock}
              iconColor="text-warning"
              iconBgColor="bg-warning/10"
            />
            <StatCard
              title="Completed"
              value={completedRequests.toString()}
              subtitle="Fulfilled requests"
              icon={CheckCircle}
              iconColor="text-success"
              iconBgColor="bg-success/10"
            />
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-12">
          <h2 className="text-xl font-display font-bold mb-6">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <ActionCard
              title="Find Books"
              description="Request individual books for students"
              icon={Search}
              to="/ngo-find-books"
              iconColor="text-primary"
              iconBgColor="bg-primary/10"
            />
            <ActionCard
              title="Track Requests"
              description="Manage pickups and collection status"
              icon={Truck}
              to="/ngo-my-requests"
              iconColor="text-secondary"
              iconBgColor="bg-secondary/20"
            />
            <ActionCard
              title="Distribute Books"
              description="Record book distributions to students"
              icon={Send}
              to="/ngo-distribution"
              iconColor="text-accent"
              iconBgColor="bg-accent/10"
            />
            <ActionCard
              title="Impact Reports"
              description="View your organization's impact"
              icon={BarChart3}
              to="/ngo-impact"
              iconColor="text-success"
              iconBgColor="bg-success/10"
            />
          </div>
        </section>



        {/* Tips */}
        <section className="bg-gradient-to-r from-success/5 to-primary/5 rounded-2xl p-6 md:p-8">
          <h3 className="font-display font-bold text-lg mb-4">💡 Coordinator Tips</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="bg-card rounded-xl p-4 shadow-soft">
              <p className="text-muted-foreground">
                <strong className="text-foreground">Individual Requests:</strong> You can now request specific books and quantities for your students.
              </p>
            </div>
            <div className="bg-card rounded-xl p-4 shadow-soft">
              <p className="text-muted-foreground">
                <strong className="text-foreground">Safe Locations:</strong> Always use verified pickup points for collections to ensure safety.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default NGODashboard;
