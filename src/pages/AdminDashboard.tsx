import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog'
import { toast } from 'sonner'
import { EmailTemplateEditor } from '../components/features/EmailTemplateEditor'

interface WaitlistEntry {
  id: string
  email: string
  first_name: string
  last_name: string
  created_at: string
}

interface FoundingMember {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  stripe_session_id?: string
  stripe_subscription_schedule_id?: string
  subscription_status?: string
  subscription_plan?: string
  subscription_type?: string
  email_verified?: boolean
  password_set?: boolean
  status?: string
  founding_member?: boolean
  created_at: string
  updated_at?: string
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  html_content: string
  created_at: string
  updated_at: string
}

interface SubscriptionChangeData {
  userId: string
  email: string
  currentPlan: string
  newPlan: string
  reason: string
}

// Plan configuration
const PLAN_TIERS = {
  PROSPECTOR: {
    name: 'Prospector',
    price: 75,
    emoji: '🥉',
    color: 'green',
    description: 'Perfect for individual professionals'
  },
  NETWORKER: {
    name: 'Networker', 
    price: 145,
    emoji: '🥈',
    color: 'blue',
    description: 'Ideal for growing teams'
  },
  RAINMAKER: {
    name: 'Rainmaker',
    price: 199,
    emoji: '🥇',
    color: 'purple',
    description: 'For sales teams and agencies'
  }
} as const

const SUBSCRIPTION_STATUSES = [
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'past_due', label: 'Past Due', color: 'yellow' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
  { value: 'incomplete', label: 'Incomplete', color: 'gray' },
  { value: 'trialing', label: 'Trialing', color: 'blue' },
  { value: 'paused', label: 'Paused', color: 'orange' }
]

export default function AdminDashboard() {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [foundingMembers, setFoundingMembers] = useState<FoundingMember[]>([])
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate>>({})
  const [showEmailTemplateEditor, setShowEmailTemplateEditor] = useState(false)
  const [subscriptionChangeData, setSubscriptionChangeData] = useState<SubscriptionChangeData | null>(null)
  const [isChangingSubscription, setIsChangingSubscription] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      console.log('Loading admin dashboard data...')
      
      // Load waitlist (active_subscribers table)
      console.log('Fetching active_subscribers...')
      const { data: waitlistData, error: waitlistError } = await supabase
        .from('active_subscribers')
        .select('*')
        .order('created_at', { ascending: false })

      if (waitlistError) {
        console.error('Waitlist error:', waitlistError)
        throw waitlistError
      }
      console.log('Waitlist data:', waitlistData)
      setWaitlist(waitlistData || [])

      // Load founding members (users table - only founding members)
      console.log('Fetching founding members...')
      let { data: foundingData, error: foundingError } = await supabase
        .from('users')
        .select('*')
        .eq('founding_member', true)
        .order('created_at', { ascending: false })

      if (foundingError) {
        console.error('Founding members error:', foundingError)
        
        // Fallback: if founding_member column doesn't exist, use subscription_plan
        if (foundingError.message.includes('column') && foundingError.message.includes('founding_member')) {
          console.log('🔄 Fallback: Using subscription_plan to identify founding members...')
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('users')
            .select('*')
            .eq('subscription_plan', 'founding_member')
            .order('created_at', { ascending: false })
          
          if (!fallbackError) {
            foundingData = fallbackData
          }
        } else if (!foundingError.message.includes('does not exist')) {
          throw foundingError
        }
      }
      console.log('Founding members data:', foundingData)
      setFoundingMembers(foundingData || [])

      // Load email templates (try to create table if it doesn't exist)
      console.log('Fetching email_templates...')
      const { data: templateData, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .order('updated_at', { ascending: false })

      if (templateError) {
        console.error('Email templates error:', templateError)
        // Don't throw error if table doesn't exist yet
        if (!templateError.message.includes('does not exist')) {
          throw templateError
        }
      }
      console.log('Email templates data:', templateData)
      setEmailTemplates(templateData || [])

    } catch (error) {
      console.error('Error loading data:', error)
      toast.error(`Failed to load data: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const changeSubscriptionPlan = async (userId: string, newPlan: string, reason: string) => {
    try {
      setIsChangingSubscription(true)
      
      // Update user in database
      const { error } = await supabase
        .from('users')
        .update({
          subscription_plan: newPlan,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      // Reload data to reflect changes
      await loadData()
      
      toast.success(`Successfully changed subscription plan to ${newPlan}`)
      setSubscriptionChangeData(null)
      
    } catch (error) {
      console.error('Error changing subscription plan:', error)
      toast.error(`Failed to change subscription plan: ${error.message}`)
    } finally {
      setIsChangingSubscription(false)
    }
  }

  const changeSubscriptionStatus = async (userId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          subscription_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      await loadData()
      toast.success(`Successfully changed subscription status to ${newStatus}`)
      
    } catch (error) {
      console.error('Error changing subscription status:', error)
      toast.error(`Failed to change subscription status: ${error.message}`)
    }
  }

  const toggleFoundingMemberStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          founding_member: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      await loadData()
      toast.success(`Successfully ${!currentStatus ? 'granted' : 'revoked'} founding member status`)
      
    } catch (error) {
      console.error('Error changing founding member status:', error)
      toast.error(`Failed to change founding member status: ${error.message}`)
    }
  }

  const resendWelcomeEmail = async (email: string, firstName: string) => {
    try {
      console.log('Attempting to send welcome email to:', email)
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-welcome-email`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'x-client-info': 'admin-dashboard/1.0'
        },
        body: JSON.stringify({ 
          email, 
          firstName,
          source: 'admin_dashboard'
        })
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Response error:', errorText)
        throw new Error(`Failed to send email: ${response.status} ${errorText}`)
      }
      
      const result = await response.json()
      console.log('Success response:', result)
      
      toast.success(`Welcome email sent to ${email}`)
    } catch (error) {
      console.error('Error sending welcome email:', error)
      
      // More specific error handling
      if (error.message.includes('CORS')) {
        toast.error('Email function needs to be redeployed. Please deploy the Edge Functions.')
      } else if (error.message.includes('404')) {
        toast.error('Email function not found. Please deploy the send-welcome-email Edge Function.')
      } else {
        toast.error(`Failed to send welcome email: ${error.message}`)
      }
    }
  }

  const resendFoundingMemberEmail = async (email: string, firstName: string, sessionId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-founding-member-email`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ email, firstName, sessionId })
      })

      if (!response.ok) throw new Error('Failed to send email')
      
      toast.success(`Founding member email sent to ${email}`)
    } catch (error) {
      console.error('Error sending founding member email:', error)
      toast.error('Failed to send founding member email')
    }
  }

  const sendPasswordReset = async (email: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-password-reset`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ email })
      })

      if (!response.ok) throw new Error('Failed to send password reset')
      
      toast.success(`Password reset sent to ${email}`)
    } catch (error) {
      console.error('Error sending password reset:', error)
      toast.error('Failed to send password reset')
    }
  }

  const saveEmailTemplate = async () => {
    if (!selectedTemplate) return

    try {
      const { error } = await supabase
        .from('email_templates')
        .update({
          subject: editingTemplate.subject || selectedTemplate.subject,
          html_content: editingTemplate.html_content || selectedTemplate.html_content,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTemplate.id)

      if (error) throw error

      toast.success('Email template updated successfully')
      loadData()
      setSelectedTemplate(null)
      setEditingTemplate({})
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPlanBadge = (planName: string) => {
    const plan = Object.values(PLAN_TIERS).find(p => p.name === planName) || PLAN_TIERS.PROSPECTOR
    const colorClasses = {
      green: 'border-green-500 text-green-700 bg-green-50',
      blue: 'border-blue-500 text-blue-700 bg-blue-50',
      purple: 'border-purple-500 text-purple-700 bg-purple-50'
    }
    
    return (
      <Badge variant="outline" className={colorClasses[plan.color]}>
        {plan.emoji} {plan.name}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = SUBSCRIPTION_STATUSES.find(s => s.value === status) || SUBSCRIPTION_STATUSES[0]
    const colorClasses = {
      green: 'border-green-500 text-green-700 bg-green-50',
      blue: 'border-blue-500 text-blue-700 bg-blue-50',
      yellow: 'border-yellow-500 text-yellow-700 bg-yellow-50',
      red: 'border-red-500 text-red-700 bg-red-50',
      gray: 'border-gray-500 text-gray-700 bg-gray-50',
      orange: 'border-orange-500 text-orange-700 bg-orange-50'
    }
    
    return (
      <Badge variant="outline" className={colorClasses[statusConfig.color]}>
        {statusConfig.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage waitlist, founding members, subscriptions, and email templates</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
            <TabsTrigger value="founding-members">Founding Members</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="email-templates">Email Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">📧</span>
                    Waitlist
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{waitlist.length}</div>
                  <p className="text-sm text-gray-600 mt-1">Total subscribers</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">👑</span>
                    Founding Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">{foundingMembers.length}</div>
                  <p className="text-sm text-gray-600 mt-1">Exclusive members</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">💳</span>
                    Active Subscriptions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {foundingMembers.filter(m => m.subscription_status === 'active').length}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Currently active</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">📝</span>
                    Email Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{emailTemplates.length}</div>
                  <p className="text-sm text-gray-600 mt-1">Available templates</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Waitlist Signups</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {waitlist.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{entry.email}</p>
                          <p className="text-sm text-gray-600">
                            {entry.first_name} {entry.last_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{formatDate(entry.created_at)}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resendWelcomeEmail(entry.email, entry.first_name)}
                          >
                            Resend Email
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Founding Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                                         {foundingMembers.slice(0, 5).map((member) => (
                       <div key={member.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                         <div>
                           <div className="flex items-center gap-2">
                             <p className="font-medium">{member.email}</p>
                             <span className="text-yellow-600">👑</span>
                           </div>
                           <p className="text-sm text-gray-600">
                             {member.first_name} {member.last_name} • {member.subscription_plan || 'Prospector'}
                           </p>
                         </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{formatDate(member.created_at)}</p>
                          <div className="flex gap-2 mt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resendFoundingMemberEmail(member.email, member.first_name, member.stripe_session_id || '')}
                            >
                              Resend Email
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendPasswordReset(member.email)}
                            >
                              Password Reset
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="waitlist" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Waitlist Management</CardTitle>
                <CardDescription>
                  Manage all waitlist subscribers and send welcome emails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {waitlist.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="font-medium">{entry.email}</p>
                          <Badge variant="secondary">Waitlist</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {entry.first_name} {entry.last_name} • {formatDate(entry.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resendWelcomeEmail(entry.email, entry.first_name)}
                        >
                          Resend Welcome Email
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Management</CardTitle>
                <CardDescription>
                  Manage user subscription plans, statuses, and founding member privileges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {foundingMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-medium">{member.email}</p>
                          {member.founding_member && (
                            <Badge variant="default" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                              👑 Founding Member
                            </Badge>
                          )}
                          {member.subscription_plan && getPlanBadge(member.subscription_plan)}
                          {member.subscription_status && getStatusBadge(member.subscription_status)}
                        </div>
                        <p className="text-sm text-gray-600">
                          {member.first_name} {member.last_name} • {formatDate(member.created_at)}
                        </p>
                        <div className="text-xs text-gray-500 mt-1">
                          {member.subscription_type && <span>Type: {member.subscription_type} • </span>}
                          {member.stripe_customer_id && <span>Customer: {member.stripe_customer_id.slice(-8)} • </span>}
                          {member.stripe_subscription_id && <span>Subscription: {member.stripe_subscription_id.slice(-8)}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {/* Change Plan */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              Change Plan
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Change Subscription Plan</DialogTitle>
                              <DialogDescription>
                                Change the subscription plan for {member.first_name} {member.last_name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Current Plan</Label>
                                <p className="text-sm text-gray-600">{member.subscription_plan || 'Prospector'}</p>
                              </div>
                              <div>
                                <Label htmlFor="new-plan">New Plan</Label>
                                <Select onValueChange={(value) => setSubscriptionChangeData({
                                  userId: member.id,
                                  email: member.email,
                                  currentPlan: member.subscription_plan || 'Prospector',
                                  newPlan: value,
                                  reason: ''
                                })}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select new plan" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Prospector">🥉 Prospector ($75/month)</SelectItem>
                                    <SelectItem value="Networker">🥈 Networker ($145/month)</SelectItem>
                                    <SelectItem value="Rainmaker">🥇 Rainmaker ($199/month)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="reason">Reason for Change</Label>
                                <Textarea
                                  id="reason"
                                  placeholder="Optional reason for this change..."
                                  value={subscriptionChangeData?.reason || ''}
                                  onChange={(e) => setSubscriptionChangeData(prev => prev ? {
                                    ...prev,
                                    reason: e.target.value
                                  } : null)}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={() => subscriptionChangeData && changeSubscriptionPlan(
                                  subscriptionChangeData.userId,
                                  subscriptionChangeData.newPlan,
                                  subscriptionChangeData.reason
                                )}
                                disabled={!subscriptionChangeData?.newPlan || isChangingSubscription}
                              >
                                {isChangingSubscription ? 'Updating...' : 'Change Plan'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        {/* Change Status */}
                        <Select onValueChange={(value) => changeSubscriptionStatus(member.id, value)}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder={member.subscription_status || 'Set Status'} />
                          </SelectTrigger>
                          <SelectContent>
                            {SUBSCRIPTION_STATUSES.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Toggle Founding Member */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant={member.founding_member ? "destructive" : "default"}>
                              {member.founding_member ? 'Revoke' : 'Grant'} Founding
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {member.founding_member ? 'Revoke' : 'Grant'} Founding Member Status
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to {member.founding_member ? 'revoke' : 'grant'} founding member status 
                                for {member.first_name} {member.last_name}? This action can be reversed later.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => toggleFoundingMemberStatus(member.id, member.founding_member || false)}>
                                {member.founding_member ? 'Revoke' : 'Grant'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="founding-members" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Founding Members Management</CardTitle>
                <CardDescription>
                  Manage founding members and send password reset links
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                                     {foundingMembers.map((member) => (
                     <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="font-medium">{member.email}</p>
                          <Badge variant="default" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                            👑 Founding Member
                          </Badge>
                          {member.subscription_plan && (
                            <Badge variant="outline" className={`${
                              member.subscription_plan === 'Rainmaker' ? 'border-purple-500 text-purple-700' :
                              member.subscription_plan === 'Networker' ? 'border-blue-500 text-blue-700' :
                              'border-green-500 text-green-700'
                            }`}>
                              {member.subscription_plan === 'Rainmaker' ? '🥇' : 
                               member.subscription_plan === 'Networker' ? '🥈' : '🥉'} {member.subscription_plan}
                            </Badge>
                          )}
                          {member.stripe_customer_id && (
                            <Badge variant="outline" className="border-green-500 text-green-700">
                              💳 Paid
                            </Badge>
                          )}
                          {member.subscription_status === 'active' && (
                            <Badge variant="outline" className="border-blue-500 text-blue-700">
                              ✅ Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {member.first_name} {member.last_name} • {formatDate(member.created_at)}
                        </p>
                        <p className="text-xs text-gray-500">Session: {member.stripe_session_id}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resendFoundingMemberEmail(member.email, member.first_name, member.stripe_session_id || '')}
                        >
                          Resend Email
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendPasswordReset(member.email)}
                        >
                          Password Reset
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email-templates" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>📧 Email Template Manager</CardTitle>
                  <CardDescription>
                    Create, edit, and preview email templates with a powerful visual editor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-4">
                        <div className="bg-blue-500 text-white p-3 rounded-lg">
                          📧
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">Advanced Email Template Editor</h3>
                          <p className="text-gray-600 mb-4">
                            Create beautiful, responsive email templates with live preview functionality. 
                            Manage variables, categories, and see exactly how your emails will look to recipients.
                          </p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            <Badge variant="secondary">✨ Live Preview</Badge>
                            <Badge variant="secondary">🎨 HTML Editor</Badge>
                            <Badge variant="secondary">📝 Variable Support</Badge>
                            <Badge variant="secondary">📱 Mobile Responsive</Badge>
                          </div>
                          <Button 
                            onClick={() => setShowEmailTemplateEditor(true)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            🚀 Open Email Template Editor
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">🎯</span>
                            <h4 className="font-medium">Template Library</h4>
                          </div>
                          <p className="text-sm text-gray-600">
                            Manage all your email templates in one place. Edit welcome emails, 
                            founding member notifications, and more.
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">👁️</span>
                            <h4 className="font-medium">Live Preview</h4>
                          </div>
                          <p className="text-sm text-gray-600">
                            See exactly how your emails will look with variable substitution 
                            and responsive design testing.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Email Template Editor Modal */}
      <EmailTemplateEditor 
        isOpen={showEmailTemplateEditor}
        onClose={() => setShowEmailTemplateEditor(false)}
      />
    </div>
  )
} 