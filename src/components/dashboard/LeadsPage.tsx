import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye,
  MoreHorizontal,
  CheckCircle,
  Circle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

const LeadsPage = () => {
  const [showContacted, setShowContacted] = useState(false);
  const [showHidden, setShowHidden] = useState(false);

  const mockLeads = [
    {
      id: 1,
      name: 'Jake McCoun',
      company: 'ScopeStack - Services CPQ',
      title: 'Senior Solutions Consultant',
      industry: 'Computer Software',
      score: 85,
      modified: 'Jun 17, 2025',
      avatar: 'JM'
    },
    {
      id: 2,
      name: 'Alex Reynolds',
      company: 'TechFlow Solutions',
      title: 'Founder',
      industry: 'Computer Software',
      score: 92,
      modified: 'Jun 15, 2025',
      avatar: 'AR'
    },
    {
      id: 3,
      name: 'Sarah Johnson',
      company: 'University of Innovation',
      title: 'Director of Operations',
      industry: 'Higher Education',
      score: 78,
      modified: 'Jun 14, 2025',
      avatar: 'SJ'
    },
    {
      id: 4,
      name: 'Mike Chen',
      company: 'Real Estate Pro',
      title: 'Senior Manager',
      industry: 'Real Estate',
      score: 88,
      modified: 'Jun 13, 2025',
      avatar: 'MC'
    },
    {
      id: 5,
      name: 'Lisa Rodriguez',
      company: 'Digital Marketing Co',
      title: 'Marketing Director',
      industry: 'Marketing',
      score: 95,
      modified: 'Jun 12, 2025',
      avatar: 'LR'
    }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 80) return 'bg-green-400';
    if (score >= 70) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">156 leads</h1>
            <p className="text-muted-foreground">OVER 1 MONTH, 1 WEEK</p>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="cursor-pointer">
                    Score ↓
                  </TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Modified</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockLeads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-xs">
                          {lead.avatar}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getScoreColor(lead.score)}`}
                            style={{ width: `${lead.score}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{lead.score}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{lead.name}</div>
                        <div className="text-sm text-muted-foreground">{lead.company}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-foreground">{lead.title}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">{lead.industry}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">{lead.modified}</div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Select
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Sidebar - Filters */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-border p-6 space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Filters</h3>
            
            {/* Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-contacted" className="text-sm">Show contacted</Label>
                <Switch
                  id="show-contacted"
                  checked={showContacted}
                  onCheckedChange={setShowContacted}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-hidden" className="text-sm">Show hidden</Label>
                <Switch
                  id="show-hidden"
                  checked={showHidden}
                  onCheckedChange={setShowHidden}
                />
              </div>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <Label className="text-sm">Search</Label>
              <Input placeholder="Enter value" />
            </div>

            {/* Score Range */}
            <div className="space-y-2">
              <Label className="text-sm">Score</Label>
              <div className="flex items-center space-x-2">
                <Input placeholder="60" className="w-16" />
                <span className="text-sm text-muted-foreground">-</span>
                <Input placeholder="100" className="w-16" />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-sm">Category</Label>
              <Input placeholder="Select an option" />
            </div>

            {/* Job Title */}
            <div className="space-y-2">
              <Label className="text-sm">Job title</Label>
              <Input placeholder="Enter value" />
            </div>

            {/* Industry */}
            <div className="space-y-2">
              <Label className="text-sm">Industry</Label>
              <Input placeholder="Enter value" />
            </div>

            {/* About */}
            <div className="space-y-2">
              <Label className="text-sm">About</Label>
              <Input placeholder="Enter value" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadsPage; 