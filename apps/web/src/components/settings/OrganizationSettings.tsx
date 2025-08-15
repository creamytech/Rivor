"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StatusBadge from '@/components/river/StatusBadge';
import { 
  Building2,
  Users,
  UserPlus,
  Crown,
  Mail,
  MoreHorizontal,
  Edit,
  Trash2,
  Send,
  Shield,
  Copy,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/river/RiverToast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';

interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending' | 'suspended';
  joinedAt: string;
  lastActiveAt?: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: 'admin' | 'member';
  invitedAt: string;
  invitedBy: string;
  expiresAt: string;
}

export default function OrganizationSettings() {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviting, setInviting] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [editingOrgName, setEditingOrgName] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    fetchOrganizationData();
  }, []);

  const fetchOrganizationData = async () => {
    setLoading(true);
    try {
      const [membersRes, invitesRes, orgRes] = await Promise.all([
        fetch('/api/organization/members'),
        fetch('/api/organization/invites'),
        fetch('/api/organization')
      ]);

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData.members || []);
      }

      if (invitesRes.ok) {
        const invitesData = await invitesRes.json();
        setPendingInvites(invitesData.invites || []);
      }

      if (orgRes.ok) {
        const orgData = await orgRes.json();
        setOrgName(orgData.name || 'My Organization');
      }
    } catch (error) {
      console.error('Failed to fetch organization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;

    setInviting(true);
    try {
      const response = await fetch('/api/organization/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole
        })
      });

      if (response.ok) {
        await fetchOrganizationData();
        setInviteEmail('');
        setInviteRole('member');
        setShowInviteDialog(false);
        
        addToast({
          type: 'success',
          title: 'Invitation Sent',
          description: `Invitation sent to ${inviteEmail}`
        });
      } else {
        throw new Error('Failed to send invitation');
      }
    } catch (error) {
      console.error('Failed to invite member:', error);
      addToast({
        type: 'error',
        title: 'Failed to Send Invitation',
        description: 'Please try again'
      });
    } finally {
      setInviting(false);
    }
  };

  const handleMemberAction = async (memberId: string, action: 'promote' | 'demote' | 'suspend' | 'remove') => {
    try {
      const response = await fetch(`/api/organization/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        await fetchOrganizationData();
        
        const actionMessages = {
          promote: 'Member promoted to admin',
          demote: 'Member demoted to regular member',
          suspend: 'Member suspended',
          remove: 'Member removed from organization'
        };

        addToast({
          type: 'success',
          title: 'Success',
          description: actionMessages[action]
        });
      } else {
        throw new Error('Failed to perform action');
      }
    } catch (error) {
      console.error('Member action failed:', error);
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to perform action. Please try again.'
      });
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      const response = await fetch(`/api/organization/invites/${inviteId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchOrganizationData();
        addToast({
          type: 'success',
          title: 'Invitation Cancelled',
          description: 'The invitation has been cancelled'
        });
      }
    } catch (error) {
      console.error('Failed to cancel invite:', error);
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to cancel invitation'
      });
    }
  };

  const handleCopyInviteLink = async (inviteId: string) => {
    try {
      const link = `${window.location.origin}/invite/${inviteId}`;
      await navigator.clipboard.writeText(link);
      setCopiedInviteId(inviteId);
      setTimeout(() => setCopiedInviteId(null), 2000);
      
      addToast({
        type: 'success',
        title: 'Link Copied',
        description: 'Invitation link copied to clipboard'
      });
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'admin':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'member':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3" />;
      case 'admin':
        return <Shield className="h-3 w-3" />;
      case 'member':
        return <Users className="h-3 w-3" />;
      default:
        return <Users className="h-3 w-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Organization Info */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Organization Details
        </h3>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-azure-500 rounded-xl flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            
            <div className="flex-1">
              {editingOrgName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="max-w-sm"
                  />
                  <Button size="sm" onClick={() => setEditingOrgName(false)}>
                    Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditingOrgName(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h4 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {orgName}
                  </h4>
                  <Button variant="ghost" size="sm" onClick={() => setEditingOrgName(true)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {members.length} member{members.length !== 1 ? 's' : ''} • Created {formatDate(new Date().toISOString())}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Team Members
          </h3>
          
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-teal-500 to-azure-500 hover:from-teal-600 hover:to-azure-600 text-white">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2 block">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                    className={cn(
                      "w-full rounded-md border border-slate-300 dark:border-slate-600",
                      "bg-white dark:bg-slate-800 px-3 py-2 text-sm",
                      "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    )}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleInviteMember}
                    disabled={!inviteEmail.trim() || inviting}
                    className="bg-gradient-to-r from-teal-500 to-azure-500 hover:from-teal-600 hover:to-azure-600 text-white"
                  >
                    {inviting ? 'Sending...' : 'Send Invitation'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {members.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-azure-400 rounded-full flex items-center justify-center text-white font-semibold">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">
                        {member.name}
                      </h4>
                      <StatusBadge
                        status={member.role}
                        label={member.role}
                        className={getRoleColor(member.role)}
                        icon={getRoleIcon(member.role)}
                      />
                      {member.status !== 'active' && (
                        <StatusBadge
                          status={member.status}
                          label={member.status}
                          className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        />
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {member.email}
                    </p>
                    <p className="text-xs text-slate-500">
                      Joined {formatDate(member.joinedAt)}
                      {member.lastActiveAt && ` • Last active ${formatDate(member.lastActiveAt)}`}
                    </p>
                  </div>
                </div>
                
                {member.role !== 'owner' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {member.role === 'member' && (
                        <DropdownMenuItem onClick={() => handleMemberAction(member.id, 'promote')}>
                          <Shield className="h-4 w-4 mr-2" />
                          Promote to Admin
                        </DropdownMenuItem>
                      )}
                      {member.role === 'admin' && (
                        <DropdownMenuItem onClick={() => handleMemberAction(member.id, 'demote')}>
                          <Users className="h-4 w-4 mr-2" />
                          Demote to Member
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleMemberAction(member.id, 'suspend')}>
                        <Mail className="h-4 w-4 mr-2" />
                        Suspend
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleMemberAction(member.id, 'remove')}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Pending Invitations
          </h3>
          
          <div className="space-y-3">
            {pendingInvites.map((invite, index) => (
              <motion.div
                key={invite.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4",
                  isExpired(invite.expiresAt) && "opacity-50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                      <Mail className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">
                          {invite.email}
                        </h4>
                        <StatusBadge
                          status={invite.role}
                          label={invite.role}
                          className={getRoleColor(invite.role)}
                          icon={getRoleIcon(invite.role)}
                        />
                        {isExpired(invite.expiresAt) && (
                          <StatusBadge
                            status="expired"
                            label="Expired"
                            className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                          />
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Invited by {invite.invitedBy} on {formatDate(invite.invitedAt)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {isExpired(invite.expiresAt) 
                          ? `Expired on ${formatDate(invite.expiresAt)}`
                          : `Expires on ${formatDate(invite.expiresAt)}`
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyInviteLink(invite.id)}
                    >
                      {copiedInviteId === invite.id ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelInvite(invite.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
