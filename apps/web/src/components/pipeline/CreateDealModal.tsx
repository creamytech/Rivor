"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  DollarSign,
  Home,
  User,
  Building,
  MapPin,
  Phone,
  Mail,
  Plus,
  X,
  Star,
  Clock,
  Target
} from "lucide-react";

interface CreateDealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDealCreated?: () => void;
  selectedStage?: string | null;
}

interface FormData {
  // Client Information
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientType: 'buyer' | 'seller' | 'investor' | 'commercial';
  
  // Property Information
  propertyAddress: string;
  propertyType: 'Single Family' | 'Condo' | 'Townhouse' | 'Multi-Family' | 'Commercial' | 'Land';
  propertyValue: string;
  bedrooms: string;
  bathrooms: string;
  squareFootage: string;
  
  // Deal Information
  dealType: 'purchase' | 'sale' | 'lease' | 'investment';
  dealValue: string;
  commission: string;
  probability: string;
  expectedCloseDate: string;
  priority: 'hot' | 'warm' | 'cold';
  
  // Additional Details
  leadSource: string;
  assignedAgent: string;
  notes: string;
  tags: string[];
}

const initialFormData: FormData = {
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  clientType: 'buyer',
  propertyAddress: '',
  propertyType: 'Single Family',
  propertyValue: '',
  bedrooms: '',
  bathrooms: '',
  squareFootage: '',
  dealType: 'purchase',
  dealValue: '',
  commission: '',
  probability: '',
  expectedCloseDate: '',
  priority: 'warm',
  leadSource: '',
  assignedAgent: '',
  notes: '',
  tags: []
};

export default function CreateDealModal({ open, onOpenChange, onDealCreated, selectedStage }: CreateDealModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [currentTag, setCurrentTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Simple body scroll management  
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  const updateFormData = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      updateFormData('tags', [...formData.tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateFormData('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Create the deal using the pipeline leads API
      const response = await fetch('/api/pipeline/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `${formData.clientName} - ${formData.propertyAddress}`,
          company: formData.clientName,
          contact: formData.clientName,
          email: formData.clientEmail,
          phone: formData.clientPhone,
          value: parseFloat(formData.dealValue) || 0,
          probability: parseFloat(formData.probability) || 50,
          priority: formData.priority,
          stage: selectedStage || 'prospect',
          source: formData.leadSource,
          description: formData.notes,
          tags: formData.tags,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Deal created successfully:', result);
        
        // Reset form and close modal
        setFormData(initialFormData);
        onOpenChange(false);
        
        // Call the callback to refresh the pipeline data
        if (onDealCreated) {
          onDealCreated();
        }
      } else {
        const error = await response.json();
        console.error('Error creating deal:', error);
        alert('Failed to create deal. Please try again.');
      }
    } catch (error) {
      console.error('Error creating deal:', error);
      alert('Failed to create deal. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'hot': return 'bg-red-100 text-red-800 border-red-200';
      case 'warm': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cold': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={onOpenChange}
    >
      <DialogContent 
        className="max-w-4xl max-h-[85vh] overflow-y-auto glass-modal glass-border-active glass-hover-glow"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl glass-text-glow">
            <Plus className="h-5 w-5" style={{ color: 'var(--glass-primary)' }} />
            Create New Deal
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="client" className="w-full">
            <TabsList className="grid w-full grid-cols-4 glass-surface glass-border glass-hover-pulse">
              <TabsTrigger value="client" className="flex items-center gap-2 glass-hover-pulse data-[state=active]:glass-badge data-[state=active]:glass-text-glow">
                <User className="h-4 w-4" />
                Client
              </TabsTrigger>
              <TabsTrigger value="property" className="flex items-center gap-2 glass-hover-pulse data-[state=active]:glass-badge data-[state=active]:glass-text-glow">
                <Home className="h-4 w-4" />
                Property
              </TabsTrigger>
              <TabsTrigger value="deal" className="flex items-center gap-2 glass-hover-pulse data-[state=active]:glass-badge data-[state=active]:glass-text-glow">
                <DollarSign className="h-4 w-4" />
                Deal
              </TabsTrigger>
              <TabsTrigger value="details" className="flex items-center gap-2 glass-hover-pulse data-[state=active]:glass-badge data-[state=active]:glass-text-glow">
                <Target className="h-4 w-4" />
                Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="client" className="space-y-4">
              <Card className="glass-card glass-hover-tilt">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientName">Client Name *</Label>
                      <Input
                        id="clientName"
                        value={formData.clientName}
                        onChange={(e) => updateFormData('clientName', e.target.value)}
                        placeholder="Enter client full name"
                        className="glass-input glass-hover-pulse"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="clientType">Client Type</Label>
                      <Select 
                        value={formData.clientType} 
                        onValueChange={(value) => updateFormData('clientType', value)}
                      >
                        <SelectTrigger className="glass-input glass-hover-pulse">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buyer">Buyer</SelectItem>
                          <SelectItem value="seller">Seller</SelectItem>
                          <SelectItem value="investor">Investor</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clientEmail">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="clientEmail"
                          type="email"
                          value={formData.clientEmail}
                          onChange={(e) => updateFormData('clientEmail', e.target.value)}
                          placeholder="client@example.com"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clientPhone">Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="clientPhone"
                          value={formData.clientPhone}
                          onChange={(e) => updateFormData('clientPhone', e.target.value)}
                          placeholder="(555) 123-4567"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="property" className="space-y-4">
              <Card className="glass-card glass-hover-tilt">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="propertyAddress">Property Address *</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="propertyAddress"
                          value={formData.propertyAddress}
                          onChange={(e) => updateFormData('propertyAddress', e.target.value)}
                          placeholder="123 Main St, City, State, ZIP"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="propertyType">Property Type</Label>
                      <Select 
                        value={formData.propertyType} 
                        onValueChange={(value) => updateFormData('propertyType', value)}
                      >
                        <SelectTrigger className="glass-input glass-hover-pulse">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Single Family">Single Family</SelectItem>
                          <SelectItem value="Condo">Condo</SelectItem>
                          <SelectItem value="Townhouse">Townhouse</SelectItem>
                          <SelectItem value="Multi-Family">Multi-Family</SelectItem>
                          <SelectItem value="Commercial">Commercial</SelectItem>
                          <SelectItem value="Land">Land</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="propertyValue">Property Value</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="propertyValue"
                          value={formData.propertyValue}
                          onChange={(e) => updateFormData('propertyValue', e.target.value)}
                          placeholder="750,000"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bedrooms">Bedrooms</Label>
                      <Input
                        id="bedrooms"
                        value={formData.bedrooms}
                        onChange={(e) => updateFormData('bedrooms', e.target.value)}
                        placeholder="3"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bathrooms">Bathrooms</Label>
                      <Input
                        id="bathrooms"
                        value={formData.bathrooms}
                        onChange={(e) => updateFormData('bathrooms', e.target.value)}
                        placeholder="2.5"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="squareFootage">Square Footage</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="squareFootage"
                          value={formData.squareFootage}
                          onChange={(e) => updateFormData('squareFootage', e.target.value)}
                          placeholder="2,150"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deal" className="space-y-4">
              <Card className="glass-card glass-hover-tilt">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dealType">Deal Type</Label>
                      <Select 
                        value={formData.dealType} 
                        onValueChange={(value) => updateFormData('dealType', value)}
                      >
                        <SelectTrigger className="glass-input glass-hover-pulse">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="purchase">Purchase</SelectItem>
                          <SelectItem value="sale">Sale</SelectItem>
                          <SelectItem value="lease">Lease</SelectItem>
                          <SelectItem value="investment">Investment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select 
                        value={formData.priority} 
                        onValueChange={(value) => updateFormData('priority', value)}
                      >
                        <SelectTrigger className="glass-input glass-hover-pulse">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hot">
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-red-500" />
                              Hot Lead
                            </div>
                          </SelectItem>
                          <SelectItem value="warm">
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-orange-500" />
                              Warm Lead
                            </div>
                          </SelectItem>
                          <SelectItem value="cold">
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-blue-500" />
                              Cold Lead
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dealValue">Deal Value *</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="dealValue"
                          value={formData.dealValue}
                          onChange={(e) => updateFormData('dealValue', e.target.value)}
                          placeholder="750,000"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="commission">Commission (%)</Label>
                      <Input
                        id="commission"
                        value={formData.commission}
                        onChange={(e) => updateFormData('commission', e.target.value)}
                        placeholder="3.0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="probability">Probability (%)</Label>
                      <Input
                        id="probability"
                        value={formData.probability}
                        onChange={(e) => updateFormData('probability', e.target.value)}
                        placeholder="75"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="expectedCloseDate"
                          type="date"
                          value={formData.expectedCloseDate}
                          onChange={(e) => updateFormData('expectedCloseDate', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Card className="glass-card glass-hover-tilt">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="leadSource">Lead Source</Label>
                      <Select 
                        value={formData.leadSource} 
                        onValueChange={(value) => updateFormData('leadSource', value)}
                      >
                        <SelectTrigger className="glass-input glass-hover-pulse">
                          <SelectValue placeholder="Select lead source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="referral">Referral</SelectItem>
                          <SelectItem value="zillow">Zillow</SelectItem>
                          <SelectItem value="realtor.com">Realtor.com</SelectItem>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="google">Google Ads</SelectItem>
                          <SelectItem value="open_house">Open House</SelectItem>
                          <SelectItem value="cold_call">Cold Call</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assignedAgent">Assigned Agent</Label>
                      <Select 
                        value={formData.assignedAgent} 
                        onValueChange={(value) => updateFormData('assignedAgent', value)}
                      >
                        <SelectTrigger className="glass-input glass-hover-pulse">
                          <SelectValue placeholder="Select agent" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sarah_johnson">Sarah Johnson</SelectItem>
                          <SelectItem value="mike_chen">Mike Chen</SelectItem>
                          <SelectItem value="lisa_williams">Lisa Williams</SelectItem>
                          <SelectItem value="david_brown">David Brown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="tags">Tags</Label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={currentTag}
                            onChange={(e) => setCurrentTag(e.target.value)}
                            placeholder="Add a tag..."
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          />
                          <Button type="button" onClick={addTag} size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {formData.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {formData.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                {tag}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 hover:bg-transparent"
                                  onClick={() => removeTag(tag)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => updateFormData('notes', e.target.value)}
                        placeholder="Additional notes about the deal..."
                        rows={4}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4 border-t glass-border">
            <div className="flex items-center gap-2">
              <Badge className={getPriorityColor(formData.priority)}>
                <Star className="h-3 w-3 mr-1" />
                {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)} Priority
              </Badge>
              {formData.dealValue && (
                <Badge variant="outline">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {formData.dealValue}
                </Badge>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="glass-button glass-hover-pulse"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !formData.clientName || !formData.propertyAddress || !formData.dealValue}
                variant="liquid"
                className="glass-button-primary glass-hover-glow glass-click-ripple"
              >
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-4 w-4 mr-2"
                  >
                    <Clock className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {isSubmitting ? 'Creating Deal...' : 'Create Deal'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}