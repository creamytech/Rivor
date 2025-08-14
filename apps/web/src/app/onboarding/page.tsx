"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/app/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Users, Mail, Calendar, Briefcase, Target } from "lucide-react";
import Logo from "@/components/branding/Logo";

const steps = [
  {
    id: "org",
    title: "Create Organization",
    description: "Set up your organization to get started",
    icon: Briefcase
  },
  {
    id: "email",
    title: "Connect Email",
    description: "Connect your Microsoft Outlook account",
    icon: Mail
  },
  {
    id: "calendar",
    title: "Connect Calendar",
    description: "Sync your calendar (optional but recommended)",
    icon: Calendar
  },
  {
    id: "pipeline",
    title: "Choose Pipeline Template",
    description: "Select a template for your sales pipeline",
    icon: Target
  },
  {
    id: "team",
    title: "Invite Teammates",
    description: "Add team members to your organization",
    icon: Users
  },
  {
    id: "complete",
    title: "All Set!",
    description: "Your Rivor workspace is ready",
    icon: CheckCircle
  }
];

const pipelineTemplates = [
  {
    id: "sales",
    name: "Sales Pipeline",
    stages: ["Lead", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"],
    description: "Perfect for B2B sales teams"
  },
  {
    id: "real-estate",
    name: "Real Estate",
    stages: ["Inquiry", "Showing", "Offer", "Under Contract", "Closed", "Lost"],
    description: "Tailored for real estate professionals"
  },
  {
    id: "consulting",
    name: "Consulting",
    stages: ["Discovery", "Proposal", "Contract", "Onboarding", "Active", "Complete"],
    description: "Ideal for consulting services"
  }
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [orgName, setOrgName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [emailConnected, setEmailConnected] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [inviteEmails, setInviteEmails] = useState("");
  const router = useRouter();

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push("/app");
    }
  };

  const back = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (steps[currentStep].id) {
      case "org":
        return orgName.trim().length > 0;
      case "email":
        return emailConnected;
      case "calendar":
        return true; // Optional step
      case "pipeline":
        return selectedTemplate.length > 0;
      case "team":
        return true; // Optional step
      case "complete":
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    
    switch (step.id) {
      case "org":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Welcome to Rivor</h2>
              <p className="text-[var(--muted-foreground)]">Let's set up your organization</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Organization Name</label>
                <Input
                  placeholder="Enter your organization name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case "email":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">Connect Your Email</h2>
              <p className="text-[var(--muted-foreground)]">
                Connect Microsoft Outlook to sync your emails and enable AI features
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-8 w-8 text-blue-600" />
                    <div>
                      <div className="font-medium">Microsoft Outlook</div>
                      <div className="text-sm text-[var(--muted-foreground)]">
                        Required for email management and AI features
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {emailConnected ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <Badge variant="status">Connected</Badge>
                      </>
                    ) : (
                      <Button 
                        variant="brand"
                        onClick={() => setEmailConnected(true)}
                      >
                        Connect Outlook
                      </Button>
                    )}
                  </div>
                </div>

                {emailConnected && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Health Check Passed</span>
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-1">
                      Email sync is working properly
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "calendar":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">Connect Your Calendar</h2>
              <p className="text-[var(--muted-foreground)]">
                Sync your calendar to enable meeting scheduling and time management features
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-8 w-8 text-blue-600" />
                    <div>
                      <div className="font-medium">Microsoft Calendar</div>
                      <div className="text-sm text-[var(--muted-foreground)]">
                        Optional but recommended for full functionality
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {calendarConnected ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <Badge variant="status">Connected</Badge>
                      </>
                    ) : (
                      <Button 
                        variant="outline"
                        onClick={() => setCalendarConnected(true)}
                      >
                        Connect Calendar
                      </Button>
                    )}
                  </div>
                </div>

                {calendarConnected && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Calendar Sync Active</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="text-center">
              <Button variant="ghost" onClick={next}>
                Skip for now
              </Button>
            </div>
          </div>
        );

      case "pipeline":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">Choose Your Pipeline Template</h2>
              <p className="text-[var(--muted-foreground)]">
                Select a template that matches your business process
              </p>
            </div>

            <div className="grid gap-4">
              {pipelineTemplates.map((template) => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all hover:border-[var(--rivor-teal)] ${
                    selectedTemplate === template.id 
                      ? "border-[var(--rivor-teal)] bg-[color-mix(in_oklab,var(--rivor-teal)_5%,transparent)]" 
                      : ""
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{template.name}</h3>
                        {selectedTemplate === template.id && (
                          <CheckCircle className="h-5 w-5 text-[var(--rivor-teal)]" />
                        )}
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {template.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {template.stages.map((stage) => (
                          <Badge key={stage} variant="secondary" className="text-xs">
                            {stage}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case "team":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">Invite Your Team</h2>
              <p className="text-[var(--muted-foreground)]">
                Add team members to collaborate on deals and leads
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Email Addresses (one per line)
                </label>
                <textarea
                  className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-transparent resize-none h-24"
                  placeholder="colleague1@company.com&#10;colleague2@company.com"
                  value={inviteEmails}
                  onChange={(e) => setInviteEmails(e.target.value)}
                />
              </div>
              
              <div className="text-center">
                <Button variant="ghost" onClick={next}>
                  Skip for now
                </Button>
              </div>
            </div>
          </div>
        );

      case "complete":
        return (
          <div className="space-y-6 text-center">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Welcome to Rivor!</h2>
                <p className="text-[var(--muted-foreground)]">
                  Your workspace is ready. Let's start managing your deals!
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Organization "{orgName}" created</span>
              </div>
              {emailConnected && (
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Email integration configured</span>
                </div>
              )}
              {calendarConnected && (
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Calendar integration configured</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Pipeline template applied</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] px-6 py-4">
        <div className="flex items-center justify-between">
          <Logo size="md" />
          <div className="text-sm text-[var(--muted-foreground)]">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-4">
        <div className="w-full bg-[var(--muted)] rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-[var(--rivor-indigo)] to-[var(--rivor-teal)] h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-2xl py-8">
        <Card>
          <CardContent className="p-8">
            {renderStepContent()}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--border)]">
              <Button 
                variant="outline"
                onClick={back}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              <Button 
                variant="brand"
                onClick={next}
                disabled={!canProceed()}
                className="flex items-center gap-2"
              >
                {currentStep === steps.length - 1 ? "Get Started" : "Continue"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


