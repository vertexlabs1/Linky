import React, { useState } from 'react';
import { useStripeEvents, useReplayWebhook } from '../hooks/useAdminApi';
import { StripeEvent } from '../types';
import DataTable from '../components/DataTable';
import { toast } from 'sonner';
import { Activity, RefreshCw, Eye } from 'lucide-react';

const StripeEventsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, error } = useStripeEvents(page, {
    ...(search && { event_type: search }),
    ...(statusFilter && { processed: statusFilter === 'processed' })
  });

  const replayWebhookMutation = useReplayWebhook();

  const handleReplayWebhook = async (event: StripeEvent) => {
    try {
      await replayWebhookMutation.mutateAsync({ eventId: event.id });
      toast.success(`Webhook replayed for event ${event.stripe_event_id}`);
    } catch (error) {
      toast.error('Failed to replay webhook');
    }
  };

  const handleViewEventData = (event: StripeEvent) => {
    // This would typically open a modal with the event data
    console.log('Event data:', event.event_data);
    toast.info('Event data logged to console');
  };

  const columns = [
    {
      key: 'stripe_event_id' as keyof StripeEvent,
      header: 'Event ID',
      sortable: true
    },
    {
      key: 'event_type' as keyof StripeEvent,
      header: 'Event Type',
      sortable: true
    },
    {
      key: 'processed' as keyof StripeEvent,
      header: 'Processed',
      sortable: true
    },
    {
      key: 'processed_at' as keyof StripeEvent,
      header: 'Processed At',
      sortable: true
    },
    {
      key: 'error_message' as keyof StripeEvent,
      header: 'Error',
      sortable: true,
      render: (value: string) => value || '-'
    },
    {
      key: 'created_at' as keyof StripeEvent,
      header: 'Created At',
      sortable: true
    }
  ];

  const filterOptions = [
    {
      key: 'processed',
      label: 'Status',
      options: [
        { value: 'processed', label: 'Processed' },
        { value: 'unprocessed', label: 'Unprocessed' }
      ],
      value: statusFilter,
      onChange: setStatusFilter
    }
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center text-red-600">
          Error loading Stripe events. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Stripe Events</h1>
        <p className="text-gray-600 mt-2">
          Monitor and manage Stripe webhook events
        </p>
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        title="Stripe Events"
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
              label: 'Replay Webhook',
              icon: RefreshCw,
              onClick: handleReplayWebhook
            },
            {
              label: 'View Event Data',
              icon: Eye,
              onClick: handleViewEventData
            }
          ]
        }}
      />
    </div>
  );
};

export default StripeEventsPage; 