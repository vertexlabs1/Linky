import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';

const AdminSubscriptions = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions Management</h1>
        <p className="text-gray-600">Manage user subscriptions and billing</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            All Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Subscription management interface coming soon...</p>
            <Button variant="outline">View Subscriptions</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSubscriptions; 