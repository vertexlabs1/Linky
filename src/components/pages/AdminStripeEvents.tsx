import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';

const AdminStripeEvents = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stripe Events</h1>
        <p className="text-gray-600">Monitor Stripe webhook events and payments</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Stripe Events Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Stripe events monitoring interface coming soon...</p>
            <Button variant="outline">View Events</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStripeEvents; 