import React, { useState } from 'react';
import { useSubscriptions, useUpdateSubscription } from '../hooks/useAdminApi';
import { Subscription } from '../types';
import DataTable from '../components/DataTable';
import { toast } from 'sonner';
import { CreditCard, DollarSign, Calendar } from 'lucide-react';

const SubscriptionsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, error } = useSubscriptions(page, {
    ...(search && { stripe_customer_id: search }),
    ...(statusFilter && { status: statusFilter })
  });

  const updateSubscriptionMutation = useUpdateSubscription();

  const handleCancelSubscription = async (subscription: Subscription) => {
    try {
      await updateSubscriptionMutation.mutateAsync({
        id: subscription.id,
        updates: { status: 'cancelled' }
      });
      toast.success(`Subscription cancelled for ${subscription.stripe_customer_id}`);
    } catch (error) {
      toast.error('Failed to cancel subscription');
    }
  };

  const handleReactivateSubscription = async (subscription: Subscription) => {
    try {
      await updateSubscriptionMutation.mutateAsync({
        id: subscription.id,
        updates: { status: 'active' }
      });
      toast.success(`Subscription reactivated for ${subscription.stripe_customer_id}`);
    } catch (error) {
      toast.error('Failed to reactivate subscription');
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const columns = [
    {
      key: 'stripe_customer_id' as keyof Subscription,
      header: 'Customer ID',
      sortable: true
    },
    {
      key: 'plan_name' as keyof Subscription,
      header: 'Plan',
      sortable: true
    },
    {
      key: 'plan_type' as keyof Subscription,
      header: 'Type',
      sortable: true
    },
    {
      key: 'status' as keyof Subscription,
      header: 'Status',
      sortable: true
    },
    {
      key: 'amount_cents' as keyof Subscription,
      header: 'Amount',
      sortable: true,
      render: (value: number) => formatCurrency(value)
    },
    {
      key: 'created_at' as keyof Subscription,
      header: 'Created At',
      sortable: true
    }
  ];

  const filterOptions = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'past_due', label: 'Past Due' },
        { value: 'unpaid', label: 'Unpaid' },
        { value: 'trialing', label: 'Trialing' }
      ],
      value: statusFilter,
      onChange: setStatusFilter
    }
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center text-red-600">
          Error loading subscriptions. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
        <p className="text-gray-600 mt-2">
          Manage user subscriptions and billing
        </p>
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        title="Subscriptions"
        isLoading={isLoading}
        pagination={data ? {
          page: data.page,
          pageSize: data.pageSize,
          totalPages: data.totalPages,
          totalCount: data.count,
          onPageChange: setPage
        } : undefined}
        filters={{
          search,
          onSearchChange: setSearch,
          filterOptions
        }}
        actions={{
          customActions: [
            {
              label: 'Cancel Subscription',
              icon: CreditCard,
              onClick: handleCancelSubscription
            },
            {
              label: 'Reactivate Subscription',
              icon: CreditCard,
              onClick: handleReactivateSubscription
            }
          ]
        }}
      />
    </div>
  );
};

export default SubscriptionsPage; 