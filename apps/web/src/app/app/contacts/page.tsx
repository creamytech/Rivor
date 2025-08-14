"use client";
import { useState } from "react";
import AppShell from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Calendar, 
  DollarSign,
  User,
  Filter,
  Download,
  Upload,
  UserPlus,
  Star,
  Link as LinkIcon,
  Activity
} from "lucide-react";
import { ContactsEmpty } from "@/components/common/States";

type Contact = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  address?: string;
  source: string;
  tags: string[];
  lastActivity: string;
  starred: boolean;
  leadCount: number;
  dealValue: string;
  avatar?: string;
};

const mockContacts: Contact[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john@smith.com",
    phone: "+1 (555) 123-4567",
    company: "Smith Properties",
    title: "CEO",
    address: "123 Main St, New York, NY",
    source: "Email",
    tags: ["hot-lead", "residential"],
    lastActivity: "2 hours ago",
    starred: true,
    leadCount: 2,
    dealValue: "$1,500,000"
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah@johnsoncorp.com",
    phone: "+1 (555) 234-5678",
    company: "Johnson Corp",
    title: "VP of Operations",
    source: "Website",
    tags: ["commercial"],
    lastActivity: "1 day ago",
    starred: false,
    leadCount: 1,
    dealValue: "$1,200,000"
  },
  {
    id: "3",
    name: "Mike Wilson",
    email: "mike@wilson.com",
    phone: "+1 (555) 345-6789",
    company: "Wilson Industries",
    title: "Director",
    source: "Referral",
    tags: ["referral", "industrial"],
    lastActivity: "3 hours ago",
    starred: false,
    leadCount: 1,
    dealValue: "$950,000"
  },
  {
    id: "4",
    name: "Emma Davis",
    email: "emma@example.com",
    company: "Davis Marketing",
    title: "Marketing Manager",
    source: "LinkedIn",
    tags: ["marketing"],
    lastActivity: "1 week ago",
    starred: true,
    leadCount: 0,
    dealValue: "$0"
  }
];

function ContactCard({ contact, onSelect }: { contact: Contact; onSelect: (contact: Contact) => void }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => onSelect(contact)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--rivor-indigo)] to-[var(--rivor-teal)] rounded-full flex items-center justify-center text-white font-medium">
              {contact.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{contact.name}</h3>
                {contact.starred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
              </div>
              {contact.title && contact.company && (
                <p className="text-sm text-[var(--muted-foreground)]">
                  {contact.title} at {contact.company}
                </p>
              )}
              <p className="text-sm text-[var(--muted-foreground)]">{contact.email}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuItem>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Lead
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-1">
            {contact.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {contact.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{contact.tags.length - 2}
              </Badge>
            )}
          </div>
          <span className="text-xs text-[var(--muted-foreground)]">
            {contact.lastActivity}
          </span>
        </div>
        
        {contact.leadCount > 0 && (
          <div className="mt-2 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{contact.leadCount} lead{contact.leadCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-green-600" />
              <span>{contact.dealValue}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ContactTable({ contacts, onSelect }: { contacts: Contact[]; onSelect: (contact: Contact) => void }) {
  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--muted)]">
            <tr>
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Company</th>
              <th className="text-left p-3 font-medium">Email</th>
              <th className="text-left p-3 font-medium">Phone</th>
              <th className="text-left p-3 font-medium">Leads</th>
              <th className="text-left p-3 font-medium">Value</th>
              <th className="text-left p-3 font-medium">Last Activity</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <tr 
                key={contact.id} 
                className="border-t border-[var(--border)] hover:bg-[var(--muted)] cursor-pointer"
                onClick={() => onSelect(contact)}
              >
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-[var(--rivor-indigo)] to-[var(--rivor-teal)] rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {contact.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{contact.name}</span>
                        {contact.starred && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                      </div>
                      {contact.title && (
                        <span className="text-xs text-[var(--muted-foreground)]">{contact.title}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  {contact.company && (
                    <div className="flex items-center gap-1">
                      <Building className="h-3 w-3 text-[var(--muted-foreground)]" />
                      <span className="text-sm">{contact.company}</span>
                    </div>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-[var(--muted-foreground)]" />
                    <span className="text-sm">{contact.email}</span>
                  </div>
                </td>
                <td className="p-3">
                  {contact.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-[var(--muted-foreground)]" />
                      <span className="text-sm">{contact.phone}</span>
                    </div>
                  )}
                </td>
                <td className="p-3">
                  <Badge variant="secondary" className="text-xs">
                    {contact.leadCount}
                  </Badge>
                </td>
                <td className="p-3">
                  <span className="text-sm font-medium">{contact.dealValue}</span>
                </td>
                <td className="p-3">
                  <span className="text-xs text-[var(--muted-foreground)]">{contact.lastActivity}</span>
                </td>
                <td className="p-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create Lead
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"table" | "cards">("table");
  const [showNewContactDialog, setShowNewContactDialog] = useState(false);
  const [filter, setFilter] = useState("all"); // all, starred, leads

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = !searchQuery || 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.company && contact.company.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = filter === "all" || 
      (filter === "starred" && contact.starred) ||
      (filter === "leads" && contact.leadCount > 0);
    
    return matchesSearch && matchesFilter;
  });

  const rightDrawer = selectedContact ? (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Contact Details</h3>
        <Button variant="ghost" size="icon" onClick={() => setSelectedContact(null)}>
          <User className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-gradient-to-br from-[var(--rivor-indigo)] to-[var(--rivor-teal)] rounded-full flex items-center justify-center text-white text-xl font-medium mx-auto">
          {selectedContact.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <h4 className="font-medium">{selectedContact.name}</h4>
          {selectedContact.title && selectedContact.company && (
            <p className="text-sm text-[var(--muted-foreground)]">
              {selectedContact.title} at {selectedContact.company}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          <span className="text-sm">{selectedContact.email}</span>
        </div>
        {selectedContact.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span className="text-sm">{selectedContact.phone}</span>
          </div>
        )}
        {selectedContact.company && (
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span className="text-sm">{selectedContact.company}</span>
          </div>
        )}
        {selectedContact.address && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{selectedContact.address}</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-sm">
          <span className="font-medium">Source:</span> {selectedContact.source}
        </div>
        <div className="text-sm">
          <span className="font-medium">Last Activity:</span> {selectedContact.lastActivity}
        </div>
      </div>

      {selectedContact.tags.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Tags</div>
          <div className="flex flex-wrap gap-1">
            {selectedContact.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="border-t pt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Active Leads</span>
          <Badge variant="secondary">{selectedContact.leadCount}</Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Total Deal Value</span>
          <span className="font-medium">{selectedContact.dealValue}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Button variant="brand" size="sm" className="w-full">
          <Mail className="h-4 w-4 mr-2" />
          Send Email
        </Button>
        <Button variant="outline" size="sm" className="w-full">
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Meeting
        </Button>
        <Button variant="outline" size="sm" className="w-full">
          <UserPlus className="h-4 w-4 mr-2" />
          Create Lead
        </Button>
        <Button variant="outline" size="sm" className="w-full">
          <LinkIcon className="h-4 w-4 mr-2" />
          View Related
        </Button>
      </div>
    </div>
  ) : undefined;

  if (contacts.length === 0) {
    return (
      <AppShell>
        <ContactsEmpty />
      </AppShell>
    );
  }

  return (
    <AppShell rightDrawer={rightDrawer}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Contacts</h1>
            <p className="text-[var(--muted-foreground)]">
              Manage your business contacts and relationships
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Dialog open={showNewContactDialog} onOpenChange={setShowNewContactDialog}>
              <DialogTrigger asChild>
                <Button variant="brand">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Contact</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name</label>
                      <Input placeholder="John Smith" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input type="email" placeholder="john@example.com" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone</label>
                      <Input placeholder="+1 (555) 123-4567" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Company</label>
                      <Input placeholder="Company name" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Job Title</label>
                    <Input placeholder="CEO, Manager, etc." />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowNewContactDialog(false)}>
                      Cancel
                    </Button>
                    <Button variant="brand" onClick={() => setShowNewContactDialog(false)}>
                      Add Contact
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-80"
              />
            </div>
            
            <div className="flex gap-1">
              <Button 
                variant={filter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                All ({contacts.length})
              </Button>
              <Button 
                variant={filter === "starred" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("starred")}
              >
                Starred ({contacts.filter(c => c.starred).length})
              </Button>
              <Button 
                variant={filter === "leads" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("leads")}
              >
                With Leads ({contacts.filter(c => c.leadCount > 0).length})
              </Button>
            </div>
          </div>

          <Tabs value={view} onValueChange={(v) => setView(v as "table" | "cards")}>
            <TabsList>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="cards">Cards</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-4">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-[var(--muted-foreground)] mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No contacts found</h3>
              <p className="text-[var(--muted-foreground)] mb-4">
                {searchQuery ? "Try adjusting your search terms" : "Get started by adding your first contact"}
              </p>
              {!searchQuery && (
                <Button variant="brand" onClick={() => setShowNewContactDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              )}
            </div>
          ) : view === "table" ? (
            <ContactTable contacts={filteredContacts} onSelect={setSelectedContact} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContacts.map((contact) => (
                <ContactCard key={contact.id} contact={contact} onSelect={setSelectedContact} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
