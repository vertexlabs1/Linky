import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title: string;
  isLoading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    onPageChange: (page: number) => void;
  };
  actions?: {
    onView?: (row: T) => void;
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
    customActions?: Array<{
      label: string;
      icon?: React.ComponentType<{ className?: string }>;
      onClick: (row: T) => void;
    }>;
  };
  filters?: {
    search?: string;
    onSearchChange?: (value: string) => void;
    filterOptions?: Array<{
      key: string;
      label: string;
      options: Array<{ value: string; label: string }>;
      value?: string;
      onChange?: (value: string) => void;
    }>;
  };
}

function DataTable<T extends { id: string }>({
  data,
  columns,
  title,
  isLoading = false,
  pagination,
  actions,
  filters
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: keyof T) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortDirection]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-orange-100 text-orange-800',
      deleted: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const renderCell = (column: Column<T>, row: T) => {
    const value = row[column.key];

    if (column.render) {
      return column.render(value, row);
    }

    // Default renderers
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (typeof value === 'string' && value.includes('T')) {
      // Likely a date string
      try {
        return formatDate(value);
      } catch {
        return value;
      }
    }

    if (column.key === 'status') {
      return getStatusBadge(value as string);
    }

    return String(value || '');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {pagination && (
            <div className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of{' '}
              {pagination.totalCount} results
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        {(filters?.search !== undefined || filters?.filterOptions) && (
          <div className="mb-6 flex flex-wrap gap-4">
            {filters.search !== undefined && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={filters.search}
                  onChange={(e) => filters.onSearchChange?.(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            )}
            {filters.filterOptions?.map((filter) => (
              <div key={filter.key} className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{filter.label}:</span>
                <select
                  value={filter.value || ''}
                  onChange={(e) => filter.onChange?.(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="">All</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`text-left py-3 px-4 font-medium text-gray-700 ${
                      column.sortable ? 'cursor-pointer hover:bg-gray-50' : ''
                    }`}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.header}</span>
                      {column.sortable && sortColumn === column.key && (
                        <span className="text-gray-400">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                {actions && <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row) => (
                <tr key={row.id} className="border-b hover:bg-gray-50">
                  {columns.map((column) => (
                    <td key={String(column.key)} className="py-3 px-4">
                      {renderCell(column, row)}
                    </td>
                  ))}
                  {actions && (
                    <td className="py-3 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions.onView && (
                            <DropdownMenuItem onClick={() => actions.onView!(row)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                          )}
                          {actions.onEdit && (
                            <DropdownMenuItem onClick={() => actions.onEdit!(row)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                                                     {actions.customActions?.map((action) => {
                             const Icon = action.icon;
                             return (
                               <DropdownMenuItem key={action.label} onClick={() => action.onClick(row)}>
                                 {Icon && <Icon className="h-4 w-4 mr-2" />}
                                 {action.label}
                               </DropdownMenuItem>
                             );
                           })}
                          {actions.onDelete && (
                            <DropdownMenuItem 
                              onClick={() => actions.onDelete!(row)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DataTable; 