import { useState } from 'react';
import { Search, Filter, Download, Eye, MessageSquare, Mail, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const DashboardPreview = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const mockLeads = [
    {
      id: 1,
      name: 'Sarah Johnson',
      title: 'VP of Marketing',
      company: 'TechStart Inc',
      industry: 'Technology',
      location: 'San Francisco, CA',
      score: 95,
      engagement: 'liked your post',
      status: 'hot',
      avatar: 'SJ',
      lastActive: '2 hours ago'
    },
    {
      id: 2,
      name: 'Mike Chen',
      title: 'Sales Director',
      company: 'GrowthCorp',
      industry: 'SaaS',
      location: 'New York, NY',
      score: 87,
      engagement: 'commented on post',
      status: 'warm',
      avatar: 'MC',
      lastActive: '5 hours ago'
    },
    {
      id: 3,
      name: 'Lisa Rodriguez',
      title: 'Founder & CEO',
      company: 'Digital Solutions',
      industry: 'Marketing',
      location: 'Austin, TX',
      score: 92,
      engagement: 'shared your article',
      status: 'hot',
      avatar: 'LR',
      lastActive: '1 day ago'
    },
    {
      id: 4,
      name: 'David Kim',
      title: 'Product Manager',
      company: 'InnovateLab',
      industry: 'Technology',
      location: 'Seattle, WA',
      score: 78,
      engagement: 'viewed your profile',
      status: 'cold',
      avatar: 'DK',
      lastActive: '3 days ago'
    },
    {
      id: 5,
      name: 'Emily Watson',
      title: 'Head of Operations',
      company: 'ScaleUp Co',
      industry: 'Finance',
      location: 'Chicago, IL',
      score: 83,
      engagement: 'liked your comment',
      status: 'warm',
      avatar: 'EW',
      lastActive: '6 hours ago'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hot': return 'bg-destructive/20 text-destructive';
      case 'warm': return 'bg-primary/20 text-primary';
      case 'cold': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-destructive';
    if (score >= 80) return 'text-primary';
    return 'text-muted-foreground';
  };

  const filteredLeads = mockLeads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || lead.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-card rounded-2xl shadow-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-accent p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary-foreground">Lead Dashboard</h2>
            <p className="text-primary-foreground/80">Track and manage your LinkedIn prospects</p>
          </div>
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse delay-300" />
            <div className="w-3 h-3 bg-accent rounded-full animate-pulse delay-600" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 border-b border-border">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leads</SelectItem>
                <SelectItem value="hot">Hot Leads</SelectItem>
                <SelectItem value="warm">Warm Leads</SelectItem>
                <SelectItem value="cold">Cold Leads</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr>
              <th className="text-left p-4 font-semibold text-foreground">Contact</th>
              <th className="text-left p-4 font-semibold text-foreground">Score</th>
              <th className="text-left p-4 font-semibold text-foreground">Engagement</th>
              <th className="text-left p-4 font-semibold text-foreground">Status</th>
              <th className="text-left p-4 font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead, index) => (
              <tr 
                key={lead.id} 
                className="border-b border-border hover:bg-muted/20 transition-smooth"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center font-semibold text-primary">
                      {lead.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{lead.name}</div>
                      <div className="text-sm text-muted-foreground">{lead.title}</div>
                      <div className="text-sm text-muted-foreground">{lead.company} • {lead.location}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className={`text-2xl font-bold ${getScoreColor(lead.score)}`}>
                    {lead.score}
                  </div>
                  <div className="text-xs text-muted-foreground">Lead Score</div>
                </td>
                <td className="p-4">
                  <div className="text-sm text-foreground capitalize">{lead.engagement}</div>
                  <div className="text-xs text-muted-foreground">{lead.lastActive}</div>
                </td>
                <td className="p-4">
                  <Badge className={`${getStatusColor(lead.status)} capitalize`}>
                    {lead.status} Lead
                  </Badge>
                </td>
                <td className="p-4">
                  <div className="flex space-x-2">
                    <Button size="sm" variant="ghost" className="w-8 h-8 p-0">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="w-8 h-8 p-0">
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="w-8 h-8 p-0">
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="w-8 h-8 p-0">
                      <Star className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 bg-muted/20 flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {filteredLeads.length} of {mockLeads.length} leads
        </div>
        <div>
          Last updated: 2 minutes ago
        </div>
      </div>
    </div>
  );
};

export default DashboardPreview;