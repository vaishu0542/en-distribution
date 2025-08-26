import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Phone, FileText } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  email: string;
}

interface Distribution {
  id: string;
  list_id: string;
  agent_id: string;
  created_at: string;
  lists: {
    first_name: string;
    phone: string;
    notes: string;
  };
  agents: {
    name: string;
    email: string;
  };
}

const DistributionView = () => {
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch agents
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('id, name, email')
        .order('name');

      if (agentsError) throw agentsError;
      setAgents(agentsData || []);

      // Fetch distributions with related data
      const { data: distributionsData, error: distributionsError } = await supabase
        .from('distributions')
        .select(`
          id,
          list_id,
          agent_id,
          created_at,
          lists (
            first_name,
            phone,
            notes
          ),
          agents (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (distributionsError) throw distributionsError;
      setDistributions(distributionsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDistributions = selectedAgent === 'all' 
    ? distributions 
    : distributions.filter(d => d.agent_id === selectedAgent);

  const getAgentStats = () => {
    const stats = agents.map(agent => {
      const agentDistributions = distributions.filter(d => d.agent_id === agent.id);
      return {
        agent,
        count: agentDistributions.length,
      };
    });
    return stats;
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const agentStats = getAgentStats();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Distributions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{distributions.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Agent</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.length > 0 ? Math.round(distributions.length / agents.length) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Distribution Summary */}
      {agentStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribution Summary by Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {agentStats.map(({ agent, count }) => (
                <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{agent.name}</p>
                    <p className="text-sm text-muted-foreground">{agent.email}</p>
                  </div>
                  <Badge variant="secondary">{count} records</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribution Details */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Distribution Details</CardTitle>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agents.map(agent => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {filteredDistributions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No distributions found. Upload a CSV file to create distributions.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>First Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Assigned Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDistributions.map((distribution) => (
                  <TableRow key={distribution.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{distribution.agents.name}</p>
                        <p className="text-sm text-muted-foreground">{distribution.agents.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{distribution.lists.first_name}</TableCell>
                    <TableCell>{distribution.lists.phone}</TableCell>
                    <TableCell className="max-w-xs truncate">{distribution.lists.notes}</TableCell>
                    <TableCell>{new Date(distribution.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DistributionView;