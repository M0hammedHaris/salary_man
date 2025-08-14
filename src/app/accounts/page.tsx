"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AccountCreateForm } from '@/components/accounts/account-create-form';
import { AccountEditForm } from '@/components/accounts/account-edit-form';
import { AccountList } from '@/components/accounts/account-list';
import { type AccountResponse } from '@/lib/types/account';
import { Plus, ArrowLeft, Wallet } from 'lucide-react';
import Link from 'next/link';

type ViewMode = 'list' | 'create' | 'edit';

export default function AccountsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedAccount, setSelectedAccount] = useState<AccountResponse | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleCreateAccount = () => {
    setIsCreateDialogOpen(true);
  };

  const handleEditAccount = (account: AccountResponse) => {
    setSelectedAccount(account);
    setIsEditDialogOpen(true);
  };

  const handleDeleteAccount = () => {
    // The AccountDeleteDialog handles the deletion logic internally
  };

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    setSelectedAccount(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCancelCreate = () => {
    setIsCreateDialogOpen(false);
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setSelectedAccount(null);
  };

  // Page content based on view mode
  const renderContent = () => {
    switch (viewMode) {
      case 'create':
        return (
          <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className="p-0 h-auto"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Accounts
              </Button>
            </div>
            
            <AccountCreateForm
              onSuccess={() => {
                setViewMode('list');
                setRefreshTrigger(prev => prev + 1);
              }}
              onCancel={() => setViewMode('list')}
            />
          </div>
        );
        
      case 'edit':
        return selectedAccount ? (
          <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setViewMode('list');
                  setSelectedAccount(null);
                }}
                className="p-0 h-auto"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Accounts
              </Button>
            </div>
            
            <AccountEditForm
              account={selectedAccount}
              onSuccess={() => {
                setViewMode('list');
                setSelectedAccount(null);
                setRefreshTrigger(prev => prev + 1);
              }}
              onCancel={() => {
                setViewMode('list');
                setSelectedAccount(null);
              }}
            />
          </div>
        ) : null;
        
      default:
        return (
          <AccountList
            onEditAccount={handleEditAccount}
            onDeleteAccount={handleDeleteAccount}
            onCreateAccount={handleCreateAccount}
            refreshTrigger={refreshTrigger}
            onAccountDeleted={() => setRefreshTrigger(prev => prev + 1)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header - Only show on list view */}
        {viewMode === 'list' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <Wallet className="h-8 w-8 text-primary" />
                Account Management
              </h1>
              <p className="text-muted-foreground">
                Manage your bank accounts, credit cards, and other financial accounts
              </p>
              
              {/* Breadcrumb for navigation */}
              <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Link href="/dashboard" className="hover:text-foreground transition-colors">
                  Dashboard
                </Link>
                <span>/</span>
                <span className="text-foreground">Accounts</span>
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main>
          {renderContent()}
        </main>

        {/* Create Account Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Account
              </DialogTitle>
              <DialogDescription>
                Add a new bank account to track your finances
              </DialogDescription>
            </DialogHeader>
            <AccountCreateForm
              onSuccess={handleCreateSuccess}
              onCancel={handleCancelCreate}
              isModal={true}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Account Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Edit Account
              </DialogTitle>
              <DialogDescription>
                Update your account details. Note that balance cannot be changed directly.
              </DialogDescription>
            </DialogHeader>
            {selectedAccount && (
              <AccountEditForm
                account={selectedAccount}
                onSuccess={handleEditSuccess}
                onCancel={handleCancelEdit}
                isModal={true}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Account Dialogs are handled within AccountList via AccountDeleteDialog */}
      </div>
    </div>
  );
}
