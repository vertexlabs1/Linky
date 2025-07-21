# 🔄 Component Migration Plan

## **📋 Components to Migrate to Admin System**

### **✅ High Priority - Must Migrate:**

#### **1. AdminUsers.tsx → UsersPage.tsx**
- **Current**: 645 lines with comprehensive user management
- **Target**: Replace UsersPage.tsx with AdminUsers functionality
- **Features**: User creation, editing, subscription management, transaction history

#### **2. AdminHealthDashboard.tsx → New HealthPage.tsx**
- **Current**: 471 lines with system monitoring
- **Target**: Create new HealthPage.tsx in admin system
- **Features**: Sync health, billing events, webhook monitoring, system stats

#### **3. AdminUserProfile.tsx → New UserProfilePage.tsx**
- **Current**: 587 lines with detailed user profiles
- **Target**: Create new UserProfilePage.tsx in admin system
- **Features**: Detailed user view, edit capabilities, billing history

### **🔄 Medium Priority - Consider Migrating:**

#### **4. AdminRoles.tsx → RolesPage.tsx**
- **Current**: 202 lines with role management
- **Target**: Enhance RolesPage.tsx with AdminRoles functionality
- **Features**: Role assignment, permission management

### **❌ Low Priority - Can Remove:**

#### **5. AdminStripeEvents.tsx, AdminPromotions.tsx, AdminNewsletter.tsx, AdminSubscriptions.tsx**
- **Status**: These are placeholder components (32 lines each)
- **Action**: Keep the admin system versions which are more comprehensive

---

## **🚀 Migration Strategy:**

### **Phase 1: Migrate Core Components**
1. **Migrate AdminUsers** → Replace UsersPage.tsx
2. **Migrate AdminHealthDashboard** → Create HealthPage.tsx
3. **Migrate AdminUserProfile** → Create UserProfilePage.tsx

### **Phase 2: Update Admin Routes**
1. **Add health route** to admin routes
2. **Add user profile route** to admin routes
3. **Update navigation** to include new pages

### **Phase 3: Clean Up**
1. **Remove old components** from src/components/pages/
2. **Update imports** throughout the codebase
3. **Test all functionality**

---

## **📁 Target Admin Structure:**

```
src/admin/
├── components/
│   ├── AdminLayout.tsx
│   ├── AdminLogin.tsx
│   └── DataTable.tsx
├── hooks/
│   ├── useAdminApi.ts
│   └── useAdminAuth.ts
├── pages/
│   ├── AdminDashboard.tsx
│   ├── UsersPage.tsx (enhanced with AdminUsers)
│   ├── HealthPage.tsx (new from AdminHealthDashboard)
│   ├── UserProfilePage.tsx (new from AdminUserProfile)
│   ├── SubscriptionsPage.tsx
│   ├── NewsletterPage.tsx
│   ├── PromotionsPage.tsx
│   ├── StripeEventsPage.tsx
│   └── RolesPage.tsx
├── routes.tsx
└── types/
    └── index.ts
```

---

## **🎯 Expected Outcome:**
- ✅ **One comprehensive admin system** at `/admin/*`
- ✅ **All functionality preserved** and enhanced
- ✅ **Clean file structure** with no duplicates
- ✅ **Consistent component patterns** 