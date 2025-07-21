import React, { useState } from 'react';
import { usePromotions } from '../hooks/useAdminApi';
import { Promotion } from '../types';
import DataTable from '../components/DataTable';
import { toast } from 'sonner';
import { Gift, DollarSign, Calendar } from 'lucide-react';

const PromotionsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, error } = usePromotions(page, {
    ...(search && { code: search }),
    ...(statusFilter && { active: statusFilter === 'active' })
  });

  const handleTogglePromotion = async (promotion: Promotion) => {
    try {
      // This would typically call an API to update the promotion status
      toast.success(`Promotion ${promotion.active ? 'deactivated' : 'activated'}`);
    } catch (error) {
      toast.error('Failed to update promotion');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const columns = [
    {
      key: 'name' as keyof Promotion,
      header: 'Name',
      sortable: true
    },
    {
      key: 'code' as keyof Promotion,
      header: 'Code',
      sortable: true
    },
    {
      key: 'type' as keyof Promotion,
      header: 'Type',
      sortable: true
    },
    {
      key: 'value' as keyof Promotion,
      header: 'Value',
      sortable: true,
      render: (value: number, row: Promotion) => {
        if (row.type === 'percentage') {
          return `${value}%`;
        } else if (row.type === 'fixed_amount') {
          return formatCurrency(value);
        }
        return value;
      }
    },
    {
      key: 'current_uses' as keyof Promotion,
      header: 'Uses',
      sortable: true,
      render: (value: number, row: Promotion) => {
        const maxUses = row.max_uses;
        return maxUses ? `${value}/${maxUses}` : value.toString();
      }
    },
    {
      key: 'active' as keyof Promotion,
      header: 'Active',
      sortable: true
    },
    {
      key: 'expires_at' as keyof Promotion,
      header: 'Expires At',
      sortable: true
    },
    {
      key: 'created_at' as keyof Promotion,
      header: 'Created At',
      sortable: true
    }
  ];

  const filterOptions = [
    {
      key: 'active',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ],
      value: statusFilter,
      onChange: setStatusFilter
    }
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center text-red-600">
          Error loading promotions. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Promotions</h1>
        <p className="text-gray-600 mt-2">
          Manage promotional codes and offers
        </p>
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        title="Promotions"
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
              label: 'Toggle Active',
              icon: Gift,
              onClick: handleTogglePromotion
            }
          ]
        }}
      />
    </div>
  );
};

export default PromotionsPage; 