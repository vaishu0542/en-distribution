import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users, Upload, BarChart3 } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Distribution Engine</h1>
            <p className="text-muted-foreground">Agent Management & Task Distribution Platform</p>
          </div>
          <Button onClick={() => navigate('/auth')}>
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Streamline Your
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"> Distribution </span>
            Process
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Efficiently manage agents, upload CSV data, and automatically distribute tasks 
            across your team with our powerful distribution engine.
          </p>
          <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8 py-6">
            Start Managing Now
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Agent Management</CardTitle>
              <CardDescription>
                Create and manage your team of agents with complete profile information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Add agents with contact details</li>
                <li>• Secure password management</li>
                <li>• Edit and update agent information</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>CSV Upload & Processing</CardTitle>
              <CardDescription>
                Upload CSV, XLSX, or XLS files and process them automatically
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Support for multiple file formats</li>
                <li>• Data validation and verification</li>
                <li>• Bulk data processing</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Intelligent Distribution</CardTitle>
              <CardDescription>
                Automatically distribute tasks equally among your agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Equal distribution algorithm</li>
                <li>• Real-time distribution tracking</li>
                <li>• Comprehensive reporting</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-card rounded-lg p-8">
          <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-muted-foreground mb-6">
            Join thousands of teams who trust our platform for their distribution needs.
          </p>
          <Button size="lg" onClick={() => navigate('/auth')}>
            Access Admin Portal
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Index;
