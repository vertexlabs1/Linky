import React, { useState } from 'react';
import { useUsers, useGrantRole, useRevokeRole, useResendEmail } from '../hooks/useAdminApi';
import { User } from '../types';
import DataTable from '../components/DataTable';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { Mail, Shield, ShieldOff, Crown } from 'lucide-react';

const UsersPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, error } = useUsers(page, {
    ...(search && { email: search }),
    ...(statusFilter && { status: statusFilter })
  });

  const grantRoleMutation = useGrantRole();
  const revokeRoleMutation = useRevokeRole();
  const resendEmailMutation = useResendEmail();

  const handleGrantAdmin = async (user: User) => {
    try {
      await grantRoleMutation.mutateAsync({ userId: user.id, roleName: 'admin' });
      toast.success(`Admin role granted to ${user.email}`);
    } catch (error) {
      toast.error('Failed to grant admin role');
    }
  };

  const handleRevokeAdmin = async (user: User) => {
    try {
      await revokeRoleMutation.mutateAsync({ userId: user.id, roleName: 'admin' });
      toast.success(`Admin role revoked from ${user.email}`);
    } catch (error) {
      toast.error('Failed to revoke admin role');
    }
  };

  const handleGrantFoundingMember = async (user: User) => {
    try {
      await grantRoleMutation.mutateAsync({ userId: user.id, roleName: 'founding_member' });
      toast.success(`Founding member role granted to ${user.email}`);
    } catch (error) {
      toast.error('Failed to grant founding member role');
    }
  };

  const handleResendWelcomeEmail = async (user: User) => {
    try {
      await resendEmailMutation.mutateAsync({ email: user.email, type: 'welcome' });
      toast.success(`Welcome email sent to ${user.email}`);
    } catch (error) {
      toast.error('Failed to send welcome email');
    }
  };

  const handleResendPasswordReset = async (user: User) => {
    try {
      await resendEmailMutation.mutateAsync({ email: user.email, type: 'password_reset' });
      toast.success(`Password reset email sent to ${user.email}`);
    } catch (error) {
      toast.error('Failed to send password reset email');
    }
  };

  const columns = [
    {
      key: 'email' as keyof User,
      header: 'Email',
      sortable: true
    },
    {
      key: 'first_name' as keyof User,
      header: 'First Name',
      sortable: true
    },
    {
      key: 'last_name' as keyof User,
      header: 'Last Name',
      sortable: true
    },
    {
      key: 'status' as keyof User,
      header: 'Status',
      sortable: true
    },
    {
      key: 'email_verified' as keyof User,
      header: 'Email Verified',
      sortable: true
    },
    {
      key: 'password_set' as keyof User,
      header: 'Password Set',
      sortable: true
    },
    {
      key: 'created_at' as keyof User,
      header: 'Created At',
      sortable: true
    }
  ];

  const filterOptions = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'active', label: 'Active' },
        { value: 'suspended', label: 'Suspended' },
        { value: 'deleted', label: 'Deleted' }
      ],
      value: statusFilter,
      onChange: setStatusFilter
    }
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center text-red-600">
          Error loading users. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-600 mt-2">
          Manage user accounts, roles, and permissions
        </p>
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        title="Users"
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
              label: 'Grant Admin',
              icon: Shield,
              onClick: handleGrantAdmin
            },
            {
              label: 'Revoke Admin',
              icon: ShieldOff,
              onClick: handleRevokeAdmin
            },
            {
              label: 'Grant Founding Member',
              icon: Crown,
              onClick: handleGrantFoundingMember
            },
            {
              label: 'Resend Welcome Email',
              icon: Mail,
              onClick: handleResendWelcomeEmail
            },
            {
              label: 'Send Password Reset',
              icon: Mail,
              onClick: handleResendPasswordReset
            }
          ]
        }}
      />
    </div>
  );
};

export default UsersPage; 