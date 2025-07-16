import { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FAQSection = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const faqs = [
    {
      question: "Does Linky work with free LinkedIn accounts?",
      answer: "Yes! Linky works with both free and premium LinkedIn accounts. However, you'll get more detailed insights and features with a LinkedIn Premium account as it provides access to more profile data."
    },
    {
      question: "Is Linky safe to use? Will it get my LinkedIn account banned?",
      answer: "Absolutely safe. Linky operates within LinkedIn's terms of service and uses only publicly available data. We don't automate actions on your behalf that could violate LinkedIn's policies. All engagement tracking is passive and compliant."
    },
    {
      question: "How does the AI lead scoring work?",
      answer: "Our AI analyzes multiple data points including company size, industry, job title, location, and engagement patterns. You can customize the scoring criteria based on your Ideal Customer Profile (ICP) to ensure the scores align with your specific business needs."
    },
    {
      question: "Can I customize the comment suggestions?",
      answer: "Yes! Our AI learns your writing style and tone from your previous comments and posts. You can also set specific guidelines and preferences to ensure all suggestions match your personal or brand voice."
    },
    {
      question: "What data sources does Linky use for profile enrichment?",
      answer: "We use publicly available data sources including LinkedIn profiles, company websites, and professional databases. All data collection is ethical and compliant with data protection regulations like GDPR."
    },
    {
      question: "How accurate is the email finding feature?",
      answer: "Our email discovery has an accuracy rate of approximately 85-90% for business emails. We use multiple verification methods to ensure email addresses are valid and deliverable before adding them to your contact list."
    },
    {
      question: "Can I integrate Linky with my CRM?",
      answer: "Yes! Linky integrates with popular CRMs including Salesforce, HubSpot, Pipedrive, and others. Our API also allows for custom integrations. The Builder and Closer plans include advanced integration features."
    },
    {
      question: "What kind of support do you provide?",
      answer: "We offer email support for all plans, with priority support for Closer plan subscribers. We also provide comprehensive documentation, video tutorials, and onboarding assistance to help you get the most out of Linky."
    },
    {
      question: "Is there a free trial available?",
      answer: "Yes! We offer a 14-day free trial with full access to all features. No credit card required to start. You can explore all of Linky's capabilities before deciding on a paid plan."
    },
    {
      question: "How often is the lead data updated?",
      answer: "Lead data is updated in real-time as new engagements occur. Profile enrichment data is refreshed every 30 days to ensure you have the most current information about your prospects."
    },
    {
      question: "Can multiple team members use one account?",
      answer: "Team collaboration features are available on the Builder and Closer plans. You can add team members, share lead lists, and collaborate on outreach campaigns. Each plan has specific user limits."
    },
    {
      question: "What happens to my data if I cancel?",
      answer: "You can export all your data (leads, contacts, analytics) before canceling. We provide a 30-day grace period where your data remains accessible for export. After that, data is securely deleted from our servers."
    }
  ];

  const filteredFAQs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section id="faqs" className="py-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 fade-in-up">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Frequently Asked{' '}
            <span className="text-primary">Questions</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Got questions? We've got answers. Can't find what you're looking for? 
            Contact our support team.
          </p>

          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-3 text-lg"
            />
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-4xl mx-auto fade-in-up">
          {filteredFAQs.length > 0 ? (
            <Accordion type="single" collapsible className="space-y-4">
              {filteredFAQs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-card rounded-lg px-6 shadow-card hover-lift transition-smooth"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-6">
                    <span className="text-lg font-semibold text-foreground pr-4">
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No results found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or browse all FAQs above.
              </p>
            </div>
          )}
        </div>

        {/* Contact Support CTA */}
        <div className="text-center mt-16 fade-in-up">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Still have questions?
            </h3>
            <p className="text-muted-foreground mb-6">
              Our support team is here to help. Get in touch and we'll respond within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-6 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-smooth">
                Contact Support
              </button>
              <button className="px-6 py-3 border border-border rounded-lg font-semibold hover:bg-muted/50 transition-smooth">
                Join Community
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;