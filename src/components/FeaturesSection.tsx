import { useState } from 'react';
import { Eye, Brain, MessageSquare, Target, Mail, Filter, Users, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const FeaturesSection = () => {
  const [selectedFeature, setSelectedFeature] = useState<number | null>(null);

  const features = [
    {
      icon: <Eye className="w-8 h-8" />,
      title: "Track Engagements",
      description: "See who liked/commented, with auto-enrichment from public data.",
      details: "Get detailed insights into every person who engages with your LinkedIn posts. Our AI automatically enriches profiles with company data, job titles, and contact information.",
      demoImage: "/api/placeholder/600/400"
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI Lead Scoring",
      description: "Scores 0-100 based on your ICP (industry, size, location).",
      details: "Our advanced AI analyzes each prospect against your Ideal Customer Profile, considering factors like company size, industry, location, and role to give you a precise lead score.",
      demoImage: "/api/placeholder/600/400"
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Comment Generation",
      description: "5 personalized suggestions in your voice.",
      details: "Generate authentic, personalized comments that sound like you. Our AI learns your writing style and creates engaging responses that drive meaningful conversations.",
      demoImage: "/api/placeholder/600/400"
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Dream Lead Monitoring",
      description: "Track top prospects and get engagement alerts.",
      details: "Keep tabs on your most important prospects. Get instant notifications when they engage with content, post updates, or show buying signals.",
      demoImage: "/api/placeholder/600/400"
    },
    {
      icon: <Mail className="w-8 h-8" />,
      title: "Email Automation",
      description: "Scrape and send sequences ethically.",
      details: "Find email addresses and send personalized sequences. All done ethically and in compliance with data protection regulations.",
      demoImage: "/api/placeholder/600/400"
    },
    {
      icon: <Filter className="w-8 h-8" />,
      title: "Feed Filtering",
      description: "Reduce noise by industry/location.",
      details: "Clean up your LinkedIn feed by filtering content based on industry, location, company size, and other criteria that matter to your business.",
      demoImage: "/api/placeholder/600/400"
    }
  ];

  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 fade-in-up">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Your AI-Powered{' '}
            <span className="text-primary">LinkedIn Wingman</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Transform your LinkedIn presence into a lead generation machine with our suite of AI-powered tools.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative bg-card rounded-xl p-6 shadow-card hover-lift transition-smooth fade-in-up cursor-pointer"
              style={{ animationDelay: `${index * 150}ms` }}
              onClick={() => setSelectedFeature(index)}
            >
              {/* Icon */}
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-lg mb-4 group-hover:bg-primary/20 transition-smooth">
                <div className="text-primary group-hover:scale-110 transition-smooth">
                  {feature.icon}
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-smooth">
                {feature.title}
              </h3>
              <p className="text-muted-foreground mb-4 line-clamp-3">
                {feature.description}
              </p>

              {/* Demo Button */}
              <Button 
                variant="outline" 
                size="sm"
                className="w-full group-hover:border-primary group-hover:text-primary transition-smooth"
              >
                <Play className="w-4 h-4 mr-2" />
                See Demo
              </Button>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl opacity-0 group-hover:opacity-100 transition-smooth -z-10" />
            </div>
          ))}
        </div>

        {/* Feature Demo Modal */}
        <Dialog open={selectedFeature !== null} onOpenChange={() => setSelectedFeature(null)}>
          <DialogContent className="max-w-4xl">
            {selectedFeature !== null && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-3 text-2xl">
                    <div className="text-primary">
                      {features[selectedFeature].icon}
                    </div>
                    <span>{features[selectedFeature].title}</span>
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  <p className="text-lg text-muted-foreground">
                    {features[selectedFeature].details}
                  </p>
                  
                  {/* Demo UI Mockup */}
                  <div className="bg-muted/30 rounded-lg p-6 border-2 border-dashed border-border">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-primary/20 rounded-lg mx-auto flex items-center justify-center">
                        <div className="text-primary text-2xl">
                          {features[selectedFeature].icon}
                        </div>
                      </div>
                      <h4 className="text-xl font-semibold text-foreground">
                        Interactive Demo Coming Soon
                      </h4>
                      <p className="text-muted-foreground">
                        Experience {features[selectedFeature].title} in action with our interactive demo.
                      </p>
                      <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        Request Early Access
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Bottom CTA */}
        <div className="text-center mt-16 fade-in-up">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Ready to Transform Your LinkedIn Strategy?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join thousands of professionals who are already using Linky to turn their LinkedIn activity into qualified leads.
            </p>
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 py-6 text-lg">
              Start Your Free Trial
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;