import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Edit,
  MoreHorizontal,
  CheckCircle,
  Circle,
  Clock,
  MessageSquare,
  Eye,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const TargetsPage = () => {
  const [showComments, setShowComments] = useState(true);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const mockPosts = [
    {
      id: 1,
      user: {
        name: 'Steve Wagner',
        title: 'COO, Manager, Underwriter, HR',
        avatar: 'SW'
      },
      postType: 'Regular',
      datePosted: 'Yesterday at 12:59 PM',
      reactions: 0,
      commented: false
    },
    {
      id: 2,
      user: {
        name: 'Kevin Harrison',
        title: 'Senior Manager',
        avatar: 'KH'
      },
      postType: 'Repost',
      datePosted: 'Yesterday at 11:20 AM',
      reactions: 11,
      commented: false
    },
    {
      id: 3,
      user: {
        name: 'Loranda Rowland',
        title: 'Marketing Director',
        avatar: 'LR'
      },
      postType: 'Quote',
      datePosted: '2 days ago',
      reactions: 24,
      commented: false
    }
  ];

  const mockComments = [
    {
      id: 1,
      text: "Absolutely love this, Jeannie! \"Feel it first so the content brings that same feeling back.\" That's exactly how you make content truly connect with people.",
      author: "Content Creator"
    },
    {
      id: 2,
      text: "You're so right—capturing real moments means being right there, in the thick of it. The best stories don't always come from planned shoots. Sometimes, the magic happens when you just show up and pay attention. It's great that you're reminding us of that.",
      author: "Marketing Pro"
    },
    {
      id: 3,
      text: "Being present is such an underrated part of content creation, and you're hitting the nail on the head here. When you feel the moment yourself, your audience will feel it too. This isn't just about good content; it's about real connection. Because genuine moments create genuine responses, every time.",
      author: "Social Media Expert"
    },
    {
      id: 4,
      text: "How do you balance planning your content ahead of time with staying open to spontaneous moments? Do you have a system for capturing these unexpected gems? I'd love to hear how you make space for the unplanned in your content strategy.",
      author: "Strategy Consultant"
    },
    {
      id: 5,
      text: "This was exactly what I needed today. Thanks for sharing such a thoughtful reminder to slow down and really feel the moment. It's easy to get caught up in the hustle, but posts like yours help bring me back to what's important.",
      author: "Business Owner"
    }
  ];

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'Regular': return 'bg-green-100 text-green-800';
      case 'Repost': return 'bg-blue-100 text-blue-800';
      case 'Quote': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePostClick = (post: any) => {
    setSelectedPost(post);
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Targets</h1>
              <p className="text-muted-foreground">Manage your LinkedIn engagement targets</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90">
              ADD TARGETS
            </Button>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-comments"
                  checked={showComments}
                  onCheckedChange={setShowComments}
                />
                <Label htmlFor="show-comments" className="text-sm">
                  Show posts with comments
                </Label>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="cursor-pointer">
                    Post type ↓
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    Date Posted ↓
                  </TableHead>
                  <TableHead>Reactions</TableHead>
                  <TableHead>Commented</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPosts.map((post) => (
                  <TableRow 
                    key={post.id} 
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => handlePostClick(post)}
                  >
                    <TableCell>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-xs">
                          {post.user.avatar}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPostTypeColor(post.postType)}>
                        {post.postType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{post.datePosted}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{post.reactions}</span>
                    </TableCell>
                    <TableCell>
                      {post.commented ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground" />
                      )}
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

        {/* Sidebar - Analytics */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-border p-6 space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Analytics</h3>
            
            {/* Stats */}
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">20 of 359</div>
              <div className="text-sm text-muted-foreground">POSTS WITH COMMENTS</div>
              <div className="mt-4">
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full"
                    style={{ width: '6%' }}
                  />
                </div>
                <div className="text-sm text-muted-foreground mt-2">6%</div>
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Days since posting</Label>
                <div className="flex items-center space-x-2">
                  <Input placeholder="0" className="w-16" />
                  <span className="text-sm text-muted-foreground">-</span>
                  <Input placeholder="5" className="w-16" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Post type</Label>
                <Input placeholder="Select an option" />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Search</Label>
                <Input placeholder="Enter value" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Post Comments</DialogTitle>
          </DialogHeader>
          
          {selectedPost && (
            <div className="space-y-6">
              {/* Original Post */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  If this is the first time I'm hitting your feed I'm Jeannie. I love to write about content strategy, 
                  social media, and the intersection of business and creativity. I'm passionate about helping creators 
                  and businesses build authentic connections through thoughtful content. Hope you follow along. ☕
                </p>
              </div>

              <div className="text-sm text-muted-foreground">
                Select a comment below to copy and visit the post
              </div>

              {/* Comments */}
              <div className="space-y-4">
                {mockComments.map((comment, index) => (
                  <div key={comment.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground mb-2">
                          Comment {index + 1}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {comment.text}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button variant="outline" className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Mark as Commented</span>
                </Button>
                <Button className="flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span>View Post</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TargetsPage; 