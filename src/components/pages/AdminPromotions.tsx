import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift } from 'lucide-react';

const AdminPromotions = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Promotions Management</h1>
        <p className="text-gray-600">Manage promotional campaigns and codes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            All Promotions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Promotion management interface coming soon...</p>
            <Button variant="outline">View Promotions</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPromotions; 