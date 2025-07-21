import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Role } from '../types';
import DataTable from '../components/DataTable';
import { toast } from 'sonner';
import { Shield, Edit, Trash2 } from 'lucide-react';

const RolesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data: roles, isLoading, error } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    }
  });

  const handleEditRole = async (role: Role) => {
    try {
      // This would typically open a modal to edit the role
      toast.info(`Edit role: ${role.name}`);
    } catch (error) {
      toast.error('Failed to edit role');
    }
  };

  const handleDeleteRole = async (role: Role) => {
    try {
      // This would typically call an API to delete the role
      toast.success(`Role ${role.name} deleted`);
    } catch (error) {
      toast.error('Failed to delete role');
    }
  };

  const columns = [
    {
      key: 'name' as keyof Role,
      header: 'Name',
      sortable: true
    },
    {
      key: 'description' as keyof Role,
      header: 'Description',
      sortable: true
    },
    {
      key: 'permissions' as keyof Role,
      header: 'Permissions',
      sortable: false,
      render: (value: Record<string, any>) => {
        const permissions = Object.keys(value || {});
        return permissions.length > 0 ? permissions.join(', ') : 'None';
      }
    },
    {
      key: 'created_at' as keyof Role,
      header: 'Created At',
      sortable: true
    }
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center text-red-600">
          Error loading roles. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Roles</h1>
        <p className="text-gray-600 mt-2">
          Manage user roles and permissions
        </p>
      </div>

      <DataTable
        data={roles || []}
        columns={columns}
        title="Roles"
        isLoading={isLoading}
        filters={{
          search,
          onSearchChange: setSearch
        }}
        actions={{
          customActions: [
            {
              label: 'Edit Role',
              icon: Edit,
              onClick: handleEditRole
            },
            {
              label: 'Delete Role',
              icon: Trash2,
              onClick: handleDeleteRole
            }
          ]
        }}
      />
    </div>
  );
};

export default RolesPage; 