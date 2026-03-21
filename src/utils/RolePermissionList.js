export const rolePermissionList = {
  admin_users: {
    read: 'admin_users_read',
    create: 'admin_users_create',
    update: 'admin_users_update',
    delete: 'admin_users_delete',
    status: 'admin_users_status',
  },
  roles: {
    read: 'roles_read',
    create: 'roles_create',
    update: 'roles_update',
    delete: 'roles_delete',
    status: 'roles_status',
  },
};

export const developerRolePermissionList = {
  sales: {
    create: 'developer_sales_create',
    read: 'developer_sales_read',
    update: 'developer_sales_update',
    delete: 'developer_sales_delete',
    status: 'developer_sales_status',
  },
  admin_users: {
    read: 'developer_admin_users_read',
    create: 'developer_admin_users_create',
    update: 'developer_admin_users_update',
    delete: 'developer_admin_users_delete',
    status: 'developer_admin_users_status',
  },
  roles: {
    read: 'developer_roles_read',
    create: 'developer_roles_create',
    update: 'developer_roles_update',
    delete: 'developer_roles_delete',
    status: 'developer_roles_status',
  },
};
