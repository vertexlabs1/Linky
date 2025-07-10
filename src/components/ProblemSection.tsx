import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle, Clock, Users } from 'lucide-react';

const ProblemSection = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      quote: "I was getting hundreds of likes but no idea who these people were or if they were potential customers.",
      author: "Sarah Chen",
      role: "Marketing Director",
      company: "TechStart Inc"
    },
    {
      quote: "Spending hours manually checking profiles and trying to figure out which leads were worth pursuing.",
      author: "Mike Johnson",
      role: "Sales Manager", 
      company: "GrowthCorp"
    },
    {
      quote: "My LinkedIn posts were popular but I couldn't convert engagement into actual business opportunities.",
      author: "Lisa Rodriguez",
      role: "Business Owner",
      company: "Digital Solutions"
    },
    {
      quote: "I needed a way to automatically identify and prioritize the best prospects from my LinkedIn activity.",
      author: "David Kim",
      role: "CEO",
      company: "InnovateLab"
    }
  ];

  const painPoints = [
    {
      icon: <Users className="w-8 h-8 text-accent" />,
      title: "Unknown Engagers",
      description: "You have no idea who's liking your posts or if they're potential customers"
    },
    {
      icon: <AlertCircle className="w-8 h-8 text-destructive" />,
      title: "Poor Fit Leads", 
      description: "Wasting time on prospects that don't match your ideal customer profile"
    },
    {
      icon: <Clock className="w-8 h-8 text-primary" />,
      title: "Manual Follow-ups",
      description: "Hours spent manually researching and crafting personalized outreach messages"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [testimonials.length]);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section id="problem" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Main Problem Statement */}
        <div className="text-center mb-16 fade-in-up">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            You're Posting and Getting Likes.{' '}
            <span className="text-accent">But Now What?</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            LinkedIn engagement is great, but without knowing who's engaging and how to convert them, 
            you're missing out on real business opportunities.
          </p>
        </div>

        {/* Pain Points Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {painPoints.map((point, index) => (
            <div 
              key={index} 
              className="text-center p-6 bg-card rounded-xl shadow-card hover-lift fade-in-up"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <div className="flex justify-center mb-4">
                {point.icon}
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {point.title}
              </h3>
              <p className="text-muted-foreground">
                {point.description}
              </p>
            </div>
          ))}
        </div>

        {/* Interactive Testimonial Carousel */}
        <div className="max-w-4xl mx-auto fade-in-up">
          <h3 className="text-2xl font-semibold text-center text-foreground mb-8">
            What our users were struggling with:
          </h3>
          
          <div className="relative bg-card rounded-2xl shadow-card p-8">
            <div className="text-center">
              <blockquote className="text-xl lg:text-2xl text-foreground italic mb-6 min-h-[100px] flex items-center justify-center">
                "{testimonials[currentTestimonial].quote}"
              </blockquote>
              
              <div className="flex items-center justify-center space-x-4">
                <div className="text-center">
                  <div className="font-semibold text-foreground">
                    {testimonials[currentTestimonial].author}
                  </div>
                  <div className="text-muted-foreground">
                    {testimonials[currentTestimonial].role}
                  </div>
                  <div className="text-sm text-accent font-medium">
                    {testimonials[currentTestimonial].company}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={prevTestimonial}
                className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-smooth hover-lift"
              >
                <ChevronLeft className="w-6 h-6 text-foreground" />
              </button>

              {/* Indicators */}
              <div className="flex space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-smooth ${
                      index === currentTestimonial 
                        ? 'bg-primary' 
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextTestimonial}
                className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-smooth hover-lift"
              >
                <ChevronRight className="w-6 h-6 text-foreground" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;