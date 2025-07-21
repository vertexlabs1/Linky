import React, { useState } from 'react';
import { useNewsletterSubscriptions } from '../hooks/useAdminApi';
import { NewsletterSubscription } from '../types';
import DataTable from '../components/DataTable';
import { toast } from 'sonner';
import { Mail, User, Calendar } from 'lucide-react';

const NewsletterPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, error } = useNewsletterSubscriptions(page, {
    ...(search && { email: search }),
    ...(statusFilter && { status: statusFilter })
  });

  const handleUnsubscribe = async (subscription: NewsletterSubscription) => {
    try {
      // This would typically call an API to update the subscription status
      toast.success(`Unsubscribed ${subscription.email}`);
    } catch (error) {
      toast.error('Failed to unsubscribe');
    }
  };

  const handleResubscribe = async (subscription: NewsletterSubscription) => {
    try {
      // This would typically call an API to update the subscription status
      toast.success(`Resubscribed ${subscription.email}`);
    } catch (error) {
      toast.error('Failed to resubscribe');
    }
  };

  const columns = [
    {
      key: 'email' as keyof NewsletterSubscription,
      header: 'Email',
      sortable: true
    },
    {
      key: 'status' as keyof NewsletterSubscription,
      header: 'Status',
      sortable: true
    },
    {
      key: 'source' as keyof NewsletterSubscription,
      header: 'Source',
      sortable: true
    },
    {
      key: 'confirmed_at' as keyof NewsletterSubscription,
      header: 'Confirmed At',
      sortable: true
    },
    {
      key: 'last_email_sent_at' as keyof NewsletterSubscription,
      header: 'Last Email Sent',
      sortable: true
    },
    {
      key: 'created_at' as keyof NewsletterSubscription,
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
        { value: 'unsubscribed', label: 'Unsubscribed' },
        { value: 'bounced', label: 'Bounced' },
        { value: 'pending', label: 'Pending' }
      ],
      value: statusFilter,
      onChange: setStatusFilter
    },
    {
      key: 'source',
      label: 'Source',
      options: [
        { value: 'waitlist', label: 'Waitlist' },
        { value: 'newsletter', label: 'Newsletter' },
        { value: 'founding_member', label: 'Founding Member' },
        { value: 'manual', label: 'Manual' },
        { value: 'import', label: 'Import' }
      ],
      value: statusFilter,
      onChange: setStatusFilter
    }
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center text-red-600">
          Error loading newsletter subscriptions. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Newsletter</h1>
        <p className="text-gray-600 mt-2">
          Manage newsletter subscriptions and email campaigns
        </p>
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        title="Newsletter Subscriptions"
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
              label: 'Unsubscribe',
              icon: Mail,
              onClick: handleUnsubscribe
            },
            {
              label: 'Resubscribe',
              icon: Mail,
              onClick: handleResubscribe
            }
          ]
        }}
      />
    </div>
  );
};

export default NewsletterPage; 