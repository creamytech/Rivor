"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Bot, 
  Copy, 
  Send, 
  RefreshCw, 
  Sparkles,
  MessageSquare,
  Clock,
  CheckCircle,
  User,
  Building,
  Calendar,
  FileText
} from "lucide-react";

type DraftTone = "professional" | "warm" | "casual" | "urgent";
type DraftType = "reply" | "follow-up" | "introduction" | "meeting-request";

type DraftSuggestion = {
  id: string;
  type: DraftType;
  tone: DraftTone;
  subject: string;
  content: string;
  reasoning: string;
  confidence: number;
};

const mockDrafts: DraftSuggestion[] = [
  {
    id: "1",
    type: "reply",
    tone: "professional",
    subject: "RE: Property Inquiry - 123 Main Street",
    content: `Hi John,

Thank you for your interest in the 123 Main Street property. I'd be happy to arrange a viewing for you this weekend.

Based on your requirements, this property offers exactly what you're looking for:
• 3 bedrooms, 2 bathrooms
• Beautiful garden with mature trees
• Quiet neighborhood with excellent schools
• Modern kitchen recently renovated

I have availability for viewings on:
• Saturday, 10:00 AM - 12:00 PM
• Sunday, 2:00 PM - 4:00 PM

Would either of these times work for you? I can also arrange an alternative time if these don't suit your schedule.

Looking forward to hearing from you.

Best regards,
[Your name]`,
    reasoning: "Professional tone matches the business context. Addresses specific interests mentioned in previous emails.",
    confidence: 95
  },
  {
    id: "2", 
    type: "reply",
    tone: "warm",
    subject: "RE: Property Inquiry - 123 Main Street",
    content: `Hi John,

Thanks so much for reaching out about the 123 Main Street property! I'm excited to help you find your perfect home.

I completely understand why this property caught your eye - it really is a gem. The garden is absolutely beautiful, especially this time of year, and the neighborhood has such a lovely community feel.

I'd love to show you around this weekend. How does Saturday morning around 10 AM sound? Or if Sunday afternoon works better, I'm flexible with timing.

Feel free to bring any questions you have - I know buying a home is a big decision and I want to make sure you have all the information you need.

Looking forward to meeting you!

Warm regards,
[Your name]`,
    reasoning: "Warmer, more personal tone to build rapport. Emphasizes emotional benefits of the property.",
    confidence: 88
  },
  {
    id: "3",
    type: "follow-up", 
    tone: "professional",
    subject: "Following up: 123 Main Street Viewing Opportunity",
    content: `Hi John,

I wanted to follow up on my previous email regarding the 123 Main Street property viewing.

I understand you may be busy, but I didn't want you to miss out on this opportunity. The property has been generating significant interest, and I'd hate for you to lose the chance to see it.

I have a few viewing slots still available this weekend:
• Saturday at 11:00 AM
• Sunday at 3:00 PM

If these times don't work, please let me know what would be more convenient for you. I'm happy to arrange a private viewing at a time that suits your schedule.

Best regards,
[Your name]

P.S. I've attached some additional photos of the garden that I thought you might enjoy seeing.`,
    reasoning: "Creates urgency while remaining respectful. Offers flexibility and additional value.",
    confidence: 91
  }
];

interface AIDraftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threadContext?: {
    subject: string;
    participants: string;
    lastMessage: string;
  };
}

export default function AIDraftModal({ open, onOpenChange, threadContext }: AIDraftModalProps) {
  const [selectedDraft, setSelectedDraft] = useState<DraftSuggestion>(mockDrafts[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customTone, setCustomTone] = useState<DraftTone>("professional");
  const [customType, setCustomType] = useState<DraftType>("reply");

  const handleRegenerateDraft = async () => {
    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(selectedDraft.content);
  };

  const handleUseDraft = () => {
    // In a real implementation, this would populate the compose window
    onOpenChange(false);
  };

  const toneColors = {
    professional: "bg-blue-100 text-blue-700",
    warm: "bg-orange-100 text-orange-700", 
    casual: "bg-green-100 text-green-700",
    urgent: "bg-red-100 text-red-700"
  };

  const typeIcons = {
    reply: <MessageSquare className="h-3 w-3" />,
    "follow-up": <Clock className="h-3 w-3" />,
    introduction: <User className="h-3 w-3" />,
    "meeting-request": <Calendar className="h-3 w-3" />
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto glass-modal glass-border-active glass-hover-glow">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-[var(--rivor-teal)]" />
            AI Email Assistant
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Draft Suggestions */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-3">Draft Suggestions</h3>
              <div className="space-y-2">
                {mockDrafts.map((draft) => (
                  <Card 
                    key={draft.id}
                    className={`cursor-pointer transition-all hover:shadow-sm ${
                      selectedDraft.id === draft.id ? "ring-2 ring-[var(--rivor-teal)]" : ""
                    }`}
                    onClick={() => setSelectedDraft(draft)}
                  >
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {typeIcons[draft.type]}
                          <span className="text-sm font-medium capitalize">
                            {draft.type.replace("-", " ")}
                          </span>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${toneColors[draft.tone]}`}
                          >
                            {draft.tone}
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-[var(--muted-foreground)]">
                          {draft.subject}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs font-medium">{draft.confidence}% confidence</span>
                          </div>
                          {selectedDraft.id === draft.id && (
                            <CheckCircle className="h-4 w-4 text-[var(--rivor-teal)]" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Custom Generation */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <h4 className="font-medium">Generate Custom Draft</h4>
                
                <Tabs value={customType} onValueChange={(v) => setCustomType(v as DraftType)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="reply">Reply</TabsTrigger>
                    <TabsTrigger value="follow-up">Follow-up</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <Tabs value={customTone} onValueChange={(v) => setCustomTone(v as DraftTone)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="professional">Professional</TabsTrigger>
                    <TabsTrigger value="warm">Warm</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleRegenerateDraft}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4 mr-2" />
                      Generate Draft
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Draft Preview */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Draft Preview</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={`text-xs ${toneColors[selectedDraft.tone]}`}>
                        {selectedDraft.tone}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {selectedDraft.confidence}% match
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-[var(--muted-foreground)]">Subject</label>
                      <div className="mt-1 p-2 bg-[var(--muted)] rounded text-sm">
                        {selectedDraft.subject}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-[var(--muted-foreground)]">Message</label>
                      <div className="mt-1 p-4 bg-[var(--muted)] rounded text-sm whitespace-pre-wrap font-mono">
                        {selectedDraft.content}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Reasoning */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-[var(--rivor-teal)]" />
                    <h4 className="font-medium">AI Reasoning</h4>
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {selectedDraft.reasoning}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Context Used */}
            {threadContext && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[var(--muted-foreground)]" />
                      <h4 className="font-medium">Context Used</h4>
                    </div>
                    <div className="text-sm text-[var(--muted-foreground)] space-y-1">
                      <div>• Previous conversation: {threadContext.subject}</div>
                      <div>• Participants: {threadContext.participants}</div>
                      <div>• Recent activity: Email received</div>
                      <div>• Contact profile: Available</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCopyDraft} className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                Copy Draft
              </Button>
              <Button variant="brand" onClick={handleUseDraft} className="flex-1">
                <Send className="h-4 w-4 mr-2" />
                Use This Draft
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
