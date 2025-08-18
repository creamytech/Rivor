"use client";
import AppShell from "@/components/app/AppShell";
import EnhancedContacts from "@/components/contacts/EnhancedContacts";
import PageHeader from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  ChevronDown, 
  Tag, 
  Search, 
  Plus,
  X,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { useState } from "react";

export default function ContactsPage() {
  const [selectedSegment, setSelectedSegment] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMergeBanner, setShowMergeBanner] = useState(true);
  const [mergeProgress, setMergeProgress] = useState(0);

  const segments = [
    { value: "all", label: "All Contacts", count: 1247 },
    { value: "hot-leads", label: "Hot Leads", count: 45 },
    { value: "clients", label: "Clients", count: 234 },
    { value: "prospects", label: "Prospects", count: 567 },
    { value: "vendors", label: "Vendors", count: 89 }
  ];

  const quickFilters = [
    { label: "Recently Added", count: 23, active: false },
    { label: "No Email", count: 45, active: false },
    { label: "No Phone", count: 67, active: false },
    { label: "Unassigned", count: 12, active: false }
  ];

  const handleMergeReview = () => {
    setMergeProgress(25);
    // Simulate merge review process
    setTimeout(() => setMergeProgress(50), 1000);
    setTimeout(() => setMergeProgress(75), 2000);
    setTimeout(() => {
      setMergeProgress(100);
      setTimeout(() => setShowMergeBanner(false), 1000);
    }, 3000);
  };

  const handleDismissMerge = () => {
    setShowMergeBanner(false);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <AppShell>
        <PageHeader
          title="Contact Flow"
          subtitle="Manage your contacts with smart organization and enrichment"
          icon={<Users className="h-6 w-6" />}
          metaChips={[
            { label: "Total contacts", value: "1,247", color: "orange" },
            { label: "Last sync", value: "1h ago", color: "blue" }
          ]}
          primaryAction={{
            label: "Add Contact",
            onClick: () => console.log("Add contact"),
            icon: <Plus className="h-4 w-4" />
          }}
          gradientColors={{
            from: "from-orange-600/12",
            via: "via-amber-600/12",
            to: "to-yellow-600/12"
          }}
        />

        {/* Enhanced Search and Filter Bar */}
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background)98%,transparent)]">
          <div className="flex items-center gap-4">
            {/* Segments Select */}
            <div className="w-48">
              <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                <SelectTrigger>
                  <SelectValue placeholder="All Contacts" />
                </SelectTrigger>
                <SelectContent>
                  {segments.map((segment) => (
                    <SelectItem key={segment.value} value={segment.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{segment.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({segment.count})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search contacts, companies, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Tag className="h-4 w-4 mr-2" />
                Tags
              </Button>
              <Button variant="outline" size="sm">
                Export
              </Button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-sm text-muted-foreground mr-2">Quick filters:</span>
            {quickFilters.map((filter, index) => (
              <Button
                key={index}
                variant={filter.active ? "default" : "outline"}
                size="sm"
                onClick={() => console.log(`Apply filter: ${filter.label}`)}
                className="text-xs h-7"
              >
                {filter.label}
                <span className="ml-1 text-xs opacity-70">({filter.count})</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Enhanced Merge Banner */}
        {showMergeBanner && (
          <div className="px-6 py-3 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    3 possible contact merges detected
                  </span>
                </div>
                
                {mergeProgress > 0 && mergeProgress < 100 && (
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-orange-200 rounded-full h-1.5">
                      <div 
                        className="bg-orange-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${mergeProgress}%` }}
                      />
                    </div>
                    <span className="text-xs text-orange-600">{mergeProgress}%</span>
                  </div>
                )}
                
                {mergeProgress === 100 && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs">Completed</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {mergeProgress === 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleMergeReview}
                    className="text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700"
                  >
                    Review
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleDismissMerge}
                  className="text-orange-600 hover:text-orange-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Contacts Component */}
        <div className="px-6 pb-8">
          <EnhancedContacts 
            selectedSegment={selectedSegment}
            searchQuery={searchQuery}
          />
        </div>
      </AppShell>
    </div>
  );
}
