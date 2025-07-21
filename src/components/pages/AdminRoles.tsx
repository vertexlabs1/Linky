import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Settings, Crown, User, Save, Plus } from 'lucide-react';

const AdminPermissions = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
        <p className="text-gray-600">Manage subscription tiers and pricing</p>
      </div>

      {/* Subscription Plans Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <CardTitle className="text-sm">Prospector</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Badge className="bg-green-100 text-green-800 border-green-200">$75/month</Badge>
            <p className="text-xs text-gray-600 mt-2">Basic features for individual professionals</p>
            <div className="mt-3 space-y-1">
              <div className="text-xs text-gray-600">• AI Lead Scoring</div>
              <div className="text-xs text-gray-600">• LinkedIn Monitoring</div>
              <div className="text-xs text-gray-600">• Lead Database</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <CardTitle className="text-sm">Networker</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">$145/month</Badge>
            <p className="text-xs text-gray-600 mt-2">Advanced features for growing teams</p>
            <div className="mt-3 space-y-1">
              <div className="text-xs text-gray-600">• Everything in Prospector</div>
              <div className="text-xs text-gray-600">• Email Templates</div>
              <div className="text-xs text-gray-600">• Email Automation</div>
              <div className="text-xs text-gray-600">• Campaign Management</div>
              <div className="text-xs text-gray-600">• Team Collaboration</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              <CardTitle className="text-sm">Rainmaker</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Badge className="bg-orange-100 text-orange-800 border-orange-200">$199/month</Badge>
            <p className="text-xs text-gray-600 mt-2">Full features for sales teams</p>
            <div className="mt-3 space-y-1">
              <div className="text-xs text-gray-600">• Everything in Networker</div>
              <div className="text-xs text-gray-600">• Advanced Analytics</div>
              <div className="text-xs text-gray-600">• Custom Integrations</div>
              <div className="text-xs text-gray-600">• Priority Support</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Plan Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium mb-2">Prospector Plan</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Monthly Price:</span>
                    <span className="text-sm font-medium">$75</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Annual Price:</span>
                    <span className="text-sm font-medium">$750</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Active Users:</span>
                    <span className="text-sm font-medium">0</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Networker Plan</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Monthly Price:</span>
                    <span className="text-sm font-medium">$145</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Annual Price:</span>
                    <span className="text-sm font-medium">$1,450</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Active Users:</span>
                    <span className="text-sm font-medium">0</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Rainmaker Plan</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Monthly Price:</span>
                    <span className="text-sm font-medium">$199</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Annual Price:</span>
                    <span className="text-sm font-medium">$1,990</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Active Users:</span>
                    <span className="text-sm font-medium">0</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Quick Actions</h4>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Settings className="w-3 h-3 mr-1" />
                  Edit Plan Features
                </Button>
                <Button size="sm" variant="outline">
                  <Crown className="w-3 h-3 mr-1" />
                  Manage Founding Members
                </Button>
                <Button size="sm" variant="outline">
                  <Plus className="w-3 h-3 mr-1" />
                  Add New Plan
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Founding Member Special */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Founding Member Program
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Founding Member Benefits</h4>
              <div className="text-sm text-purple-700 space-y-1">
                <div>• Special $25/month pricing for first 3 months</div>
                <div>• All Prospector features included</div>
                <div>• Early access to new features</div>
                <div>• Direct feedback channel</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium mb-2">Current Founding Members</h5>
                <div className="text-2xl font-bold text-purple-600">0</div>
                <p className="text-xs text-gray-600">Active founding members</p>
              </div>
              
              <div>
                <h5 className="font-medium mb-2">Program Status</h5>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
                <p className="text-xs text-gray-600 mt-1">Accepting new founding members</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPermissions; 