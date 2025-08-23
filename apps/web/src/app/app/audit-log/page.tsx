"use client";
import { useState } from "react";
import AppShell from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Download, 
  Calendar,
  User,
  Mail,
  Shield,
  Key,
  Trash2,
  Edit,
  Eye,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink
} from "lucide-react";

type AuditEvent = {
  id: string;
  timestamp: Date;
  actor: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  resource: string;
  details: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  category: "auth" | "data" | "billing" | "settings" | "security";
  severity: "low" | "medium" | "high" | "critical";
  traceId: string;
};

const mockAuditEvents: AuditEvent[] = [
  {
    id: "1",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    actor: {
      id: "user-1",
      name: "John Smith",
      email: "john@example.com",
      role: "Owner"
    },
    action: "email_sent",
    resource: "thread:thread-123",
    details: "Sent email reply to Sarah Johnson regarding property inquiry",
    success: true,
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    category: "data",
    severity: "low",
    traceId: "trace-001"
  },
  {
    id: "2", 
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    actor: {
      id: "user-1",
      name: "John Smith", 
      email: "john@example.com",
      role: "Owner"
    },
    action: "lead_stage_changed",
    resource: "lead:lead-456",
    details: "Moved lead 'Sarah Johnson - Commercial Deal' from Qualified to Proposal stage",
    success: true,
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    category: "data",
    severity: "medium", 
    traceId: "trace-002"
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    actor: {
      id: "user-2",
      name: "Alice Johnson",
      email: "alice@example.com", 
      role: "Admin"
    },
    action: "user_login",
    resource: "auth:session",
    details: "Successful login from new device",
    success: true,
    ipAddress: "203.0.113.42",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    category: "auth",
    severity: "low",
    traceId: "trace-003"
  },
  {
    id: "4",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    actor: {
      id: "system",
      name: "System",
      email: "system@rivor.app",
      role: "System"
    },
    action: "data_retention_applied",
    resource: "data:emails",
    details: "Automatically deleted 15 emails older than 90 days per retention policy",
    success: true,
    ipAddress: "10.0.0.1",
    userAgent: "Rivor/1.0 (Internal)",
    category: "data",
    severity: "medium",
    traceId: "trace-004"
  },
  {
    id: "5",
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    actor: {
      id: "user-3",
      name: "Bob Wilson",
      email: "bob@example.com",
      role: "Agent" 
    },
    action: "login_failed",
    resource: "auth:session",
    details: "Failed login attempt - invalid password (3rd attempt)",
    success: false,
    ipAddress: "198.51.100.10",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)",
    category: "auth",
    severity: "high",
    traceId: "trace-005"
  },
  {
    id: "6",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    actor: {
      id: "user-1",
      name: "John Smith",
      email: "john@example.com",
      role: "Owner"
    },
    action: "encryption_key_rotated",
    resource: "security:dek",
    details: "DEK rotated successfully, re-encrypted 1,247 records",
    success: true,
    ipAddress: "192.168.1.100", 
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    category: "security",
    severity: "critical",
    traceId: "trace-006"
  }
];

export default function AuditLogPage() {
  const [events] = useState<AuditEvent[]>(mockAuditEvents);
  // TODO: Implement setEvents when API integration is added
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [dateRange, setDateRange] = useState("7d");
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  const filteredEvents = events.filter(event => {
    const matchesSearch = !searchQuery || 
      event.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.actor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.resource.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || event.category === categoryFilter;
    const matchesSeverity = severityFilter === "all" || event.severity === severityFilter;
    
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const getActionIcon = (action: string) => {
    if (action.includes("login")) return <User className="h-4 w-4" />;
    if (action.includes("email")) return <Mail className="h-4 w-4" />;
    if (action.includes("lead")) return <FileText className="h-4 w-4" />;
    if (action.includes("key") || action.includes("encryption")) return <Key className="h-4 w-4" />;
    if (action.includes("delete")) return <Trash2 className="h-4 w-4" />;
    if (action.includes("edit") || action.includes("update")) return <Edit className="h-4 w-4" />;
    return <Eye className="h-4 w-4" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-700 border-red-200";
      case "high": return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "auth": return "bg-blue-100 text-blue-700";
      case "data": return "bg-purple-100 text-purple-700";
      case "security": return "bg-red-100 text-red-700";
      case "billing": return "bg-green-100 text-green-700";
      case "settings": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Event Details</h3>
          <Button variant="ghost" size="icon" onClick={() => setSelectedEvent(null)}>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-1">Action</div>
            <div className="flex items-center gap-2">
              {getActionIcon(selectedEvent.action)}
              <span className="text-sm">{selectedEvent.action}</span>
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium mb-1">Status</div>
            <div className="flex items-center gap-2">
              {selectedEvent.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">{selectedEvent.success ? "Success" : "Failed"}</span>
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium mb-1">Actor</div>
            <div className="text-sm">
              <div className="font-medium">{selectedEvent.actor.name}</div>
              <div className="text-[var(--muted-foreground)]">{selectedEvent.actor.email}</div>
              <Badge variant="outline" className="text-xs mt-1">
                {selectedEvent.actor.role}
              </Badge>
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium mb-1">Resource</div>
            <div className="text-sm font-mono bg-[var(--muted)] p-2 rounded">
              {selectedEvent.resource}
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium mb-1">Details</div>
            <div className="text-sm">{selectedEvent.details}</div>
          </div>
          
          <div>
            <div className="text-sm font-medium mb-1">Timestamp</div>
            <div className="text-sm">{formatTimestamp(selectedEvent.timestamp)}</div>
          </div>
          
          <div>
            <div className="text-sm font-medium mb-1">Category & Severity</div>
            <div className="flex gap-2">
              <Badge variant="secondary" className={getCategoryColor(selectedEvent.category)}>
                {selectedEvent.category}
              </Badge>
              <Badge variant="outline" className={getSeverityColor(selectedEvent.severity)}>
                {selectedEvent.severity}
              </Badge>
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium mb-1">Technical Details</div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="font-medium">IP Address:</span> {selectedEvent.ipAddress}
              </div>
              <div>
                <span className="font-medium">User Agent:</span>
                <div className="text-[var(--muted-foreground)] break-all">
                  {selectedEvent.userAgent}
                </div>
              </div>
              <div>
                <span className="font-medium">Trace ID:</span> 
                <span className="font-mono ml-1">{selectedEvent.traceId}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Audit Log</h1>
            <p className="text-[var(--muted-foreground)]">
              Security and activity logs for your organization
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Date Range
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-16"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="data">Data Operations</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--muted-foreground)]">Total Events</p>
                  <p className="text-2xl font-bold">{filteredEvents.length}</p>
                </div>
                <Clock className="h-8 w-8 text-[var(--muted-foreground)]" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--muted-foreground)]">Failed Events</p>
                  <p className="text-2xl font-bold text-red-600">
                    {filteredEvents.filter(e => !e.success).length}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--muted-foreground)]">High Severity</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {filteredEvents.filter(e => e.severity === "high" || e.severity === "critical").length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--muted-foreground)]">Auth Events</p>
                  <p className="text-2xl font-bold">
                    {filteredEvents.filter(e => e.category === "auth").length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-[var(--muted-foreground)]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events List */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="p-4 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        {getActionIcon(event.action)}
                        {event.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{event.action}</span>
                          <Badge variant="secondary" className={getCategoryColor(event.category)}>
                            {event.category}
                          </Badge>
                          <Badge variant="outline" className={getSeverityColor(event.severity)}>
                            {event.severity}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-[var(--muted-foreground)] mb-2">
                          {event.details}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                          <span>{event.actor.name} ({event.actor.role})</span>
                          <span>•</span>
                          <span>{formatTimestamp(event.timestamp)}</span>
                          <span>•</span>
                          <span className="font-mono">{event.traceId}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredEvents.length === 0 && (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-[var(--muted-foreground)] mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No audit events found</h3>
                  <p className="text-[var(--muted-foreground)]">
                    Try adjusting your search filters or date range
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}