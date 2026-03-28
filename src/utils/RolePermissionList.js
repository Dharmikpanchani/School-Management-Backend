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
  dashboard: {
    read: "dashboard_view",
  },
  school: {
    create: "school_add",
    update: "school_edit",
    read: "school_view",
    delete: "school_delete",
    status: "school_status",
  },
  role: {
    create: "admin_role_add",
    update: "admin_role_edit",
    read: "admin_role_view",
    delete: "admin_role_delete",
    status: "admin_role_status",
  },
  admin_user: {
    create: "admin_user_add",
    update: "admin_user_edit",
    read: "admin_user_view",
    delete: "admin_user_delete",
    status: "admin_user_status",
  },
  user: {
    read: "user_view",
    delete: "user_delete",
    status: "user_status",
  },
  faq: {
    create: "faq_add",
    update: "faq_edit",
    read: "faq_view",
    delete: "faq_delete",
    status: "faq_status",
  },
  about_us: {
    create: "about_us_add",
    update: "about_us_edit",
    read: "about_us_view",
    delete: "about_us_delete",
    status: "about_us_status",
  },
  contact_us: {
    read: "contact_view",
    delete: "contact_delete",
  },
  cms: {
    terms_edit: "terms_and_condition_edit",
    privacy_edit: "privacy_policy_edit",
    about_edit: "about_us_edit",
  },
};
