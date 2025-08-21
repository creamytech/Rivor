"use client";

import { useState, useEffect } from 'react';
import AppShell from "@/components/app/AppShell";

interface AnalyticsData {
  weeklyActivity: { date: string; emails: number; leads: number; deals: number }[];
  leadSources: { source: string; count: number; percentage: number }[];
  responseTime: { metric: string; value: string; trend: 'up' | 'down' | 'stable' }[];
  totals: {
    totalEmails: number;
    totalLeads: number;
    totalDeals: number;
    avgResponseTime: string;
  };
}

function exportCsv(data: AnalyticsData) {
  const csvData = [
    ["metric", "value"],
    ["total_emails", data.totals.totalEmails.toString()],
    ["total_leads", data.totals.totalLeads.toString()],
    ["total_deals", data.totals.totalDeals.toString()],
    ["avg_response_time", data.totals.avgResponseTime],
    ...data.leadSources.map(source => [`lead_source_${source.source.toLowerCase()}`, source.count.toString()]),
  ];
  const csv = csvData.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rivor-analytics-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // In development, use mock data
      if (process.env.NODE_ENV === 'development') {
        const mockData: AnalyticsData = {
          weeklyActivity: [
            { date: '2024-01-15', emails: 12, leads: 5, deals: 2 },
            { date: '2024-01-16', emails: 18, leads: 8, deals: 1 },
            { date: '2024-01-17', emails: 15, leads: 6, deals: 3 },
            { date: '2024-01-18', emails: 22, leads: 12, deals: 4 },
            { date: '2024-01-19', emails: 19, leads: 9, deals: 2 },
            { date: '2024-01-20', emails: 14, leads: 7, deals: 1 },
            { date: '2024-01-21', emails: 16, leads: 10, deals: 3 },
          ],
          leadSources: [
            { source: 'Website', count: 45, percentage: 40 },
            { source: 'Social Media', count: 28, percentage: 25 },
            { source: 'Referral', count: 23, percentage: 20 },
            { source: 'Email Campaign', count: 17, percentage: 15 },
          ],
          responseTime: [
            { metric: 'Avg Response Time', value: '2.5 hours', trend: 'down' },
            { metric: 'First Response', value: '45 minutes', trend: 'down' },
            { metric: 'Resolution Time', value: '4.2 hours', trend: 'stable' },
          ],
          totals: {
            totalEmails: 116,
            totalLeads: 57,
            totalDeals: 16,
            avgResponseTime: '2.5 hours'
          }
        };
        setAnalyticsData(mockData);
      } else {
        const response = await fetch(`/api/analytics?days=${timeRange}`);
        if (response.ok) {
          const data = await response.json();
          setAnalyticsData(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="container py-4">
        <div className="flex flex-wrap gap-2 text-sm mb-3">
          <select 
            className="px-2 py-1 rounded border border-[var(--border)] bg-transparent"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <select className="px-2 py-1 rounded border border-[var(--border)] bg-transparent">
            <option>Owner: All</option>
          </select>
          <select className="px-2 py-1 rounded border border-[var(--border)] bg-transparent">
            <option>Source: All</option>
          </select>
          <button 
            onClick={() => analyticsData && exportCsv(analyticsData)} 
            className="ml-auto px-2 py-1 rounded border border-[var(--border)]"
            disabled={!analyticsData}
          >
            Export CSV
          </button>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-3">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-40 bg-gray-100 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : analyticsData ? (
          <div className="grid md:grid-cols-3 gap-3">
            <div className="card p-3">
              <div className="text-sm font-medium mb-2">Weekly activity</div>
              <div className="h-40 border border-[var(--border)] rounded p-3">
                <div className="space-y-2">
                  {analyticsData.weeklyActivity.slice(-4).map((day, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span>{new Date(day.date).toLocaleDateString()}</span>
                      <div className="flex gap-2">
                        <span className="text-blue-600">{day.emails}e</span>
                        <span className="text-green-600">{day.leads}l</span>
                        <span className="text-purple-600">{day.deals}d</span>
                      </div>
                    </div>
                  ))}
                  <div className="mt-3 pt-2 border-t text-xs">
                    <div className="flex justify-between font-medium">
                      <span>Totals:</span>
                      <div className="flex gap-2">
                        <span className="text-blue-600">{analyticsData.totals.totalEmails}</span>
                        <span className="text-green-600">{analyticsData.totals.totalLeads}</span>
                        <span className="text-purple-600">{analyticsData.totals.totalDeals}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card p-3">
              <div className="text-sm font-medium mb-2">Lead sources</div>
              <div className="h-40 border border-[var(--border)] rounded p-3">
                <div className="space-y-2">
                  {analyticsData.leadSources.map((source, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span>{source.source}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full" 
                            style={{ width: `${source.percentage}%` }}
                          ></div>
                        </div>
                        <span className="font-medium">{source.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="card p-3">
              <div className="text-sm font-medium mb-2">Response time</div>
              <div className="h-40 border border-[var(--border)] rounded p-3">
                <div className="space-y-3">
                  {analyticsData.responseTime.map((metric, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span>{metric.metric}</span>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{metric.value}</span>
                        <span className={`text-xs ${
                          metric.trend === 'up' ? 'text-red-500' : 
                          metric.trend === 'down' ? 'text-green-500' : 
                          'text-gray-500'
                        }`}>
                          {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-3">
            <div className="card p-3">
              <div className="text-sm font-medium mb-2">Weekly activity</div>
              <div className="h-40 border border-[var(--border)] rounded grid place-items-center text-xs text-[var(--muted-foreground)]">No data available</div>
            </div>
            <div className="card p-3">
              <div className="text-sm font-medium mb-2">Lead sources</div>
              <div className="h-40 border border-[var(--border)] rounded grid place-items-center text-xs text-[var(--muted-foreground)]">No data available</div>
            </div>
            <div className="card p-3">
              <div className="text-sm font-medium mb-2">Response time</div>
              <div className="h-40 border border-[var(--border)] rounded grid place-items-center text-xs text-[var(--muted-foreground)]">No data available</div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}


