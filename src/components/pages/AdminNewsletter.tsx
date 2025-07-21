import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

const AdminNewsletter = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Newsletter Management</h1>
        <p className="text-gray-600">Manage newsletter subscriptions and campaigns</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Newsletter Subscribers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Newsletter management interface coming soon...</p>
            <Button variant="outline">View Subscribers</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNewsletter; 