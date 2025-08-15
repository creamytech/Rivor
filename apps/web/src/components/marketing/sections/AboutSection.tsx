"use client";

export function AboutSection() {
  return (
    <section className="container py-20 md:py-24">
      {/* Wave Divider */}
      <div className="relative mb-16">
        <div className="absolute inset-0 wave-gradient opacity-20 h-px"></div>
      </div>

      <div className="grid gap-16 lg:gap-20 lg:grid-cols-2 items-center">
        
        {/* Left: Mission & Team Content */}
        <div className="space-y-8 animate-fade-up">
          <div>
            <h2 className="text-display-md md:text-display-lg mb-6">
              Built by Real Estate{" "}
              <span className="gradient-text">Professionals</span>
            </h2>
            <p className="text-body-lg text-muted-foreground leading-relaxed mb-6">
              We understand the chaos of managing dozens of client conversations, 
              coordinating showings, and tracking deals across multiple platforms because 
              we've been there.
            </p>
            <p className="text-body-lg text-muted-foreground leading-relaxed">
              Rivor was born from real agents' frustrations with scattered tools and 
              missed opportunities. We built the unified workspace we wished we had—one 
              that actually helps you close more deals, not just manage more data.
            </p>
          </div>

          {/* Mission Statement */}
          <div className="card p-6 bg-gradient-to-br from-rivor-indigo/5 to-rivor-teal/5">
            <h3 className="text-lg font-semibold mb-3">Our Mission</h3>
            <p className="text-muted-foreground leading-relaxed">
              To empower real estate professionals with intelligent automation that 
              eliminates busywork and amplifies what makes them successful: building 
              relationships and closing deals.
            </p>
          </div>

          {/* Team Stats */}
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold gradient-text mb-2">15+ Years</div>
              <div className="text-sm text-muted-foreground">Combined RE Experience</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold gradient-text mb-2">$500M+</div>
              <div className="text-sm text-muted-foreground">Deals Closed by Founders</div>
            </div>
          </div>
        </div>

        {/* Right: Team Visual or Abstract */}
        <div className="relative animate-fade-up-delay-1">
          {/* Abstract team representation */}
          <div className="relative h-96 rounded-2xl overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-rivor-deep via-rivor-indigo to-rivor-teal opacity-80"></div>
            
            {/* Floating elements representing team/collaboration */}
            <div className="absolute inset-0 p-8 flex flex-col justify-center">
              
              {/* Team avatars representation */}
              <div className="flex items-center justify-center mb-8 space-x-4">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <span className="text-xl">👩‍💼</span>
                </div>
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <span className="text-xl">👨‍💻</span>
                </div>
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <span className="text-xl">👩‍💻</span>
                </div>
              </div>

              {/* Mission visualization */}
              <div className="text-center text-white">
                <div className="text-lg font-semibold mb-4">
                  Real Estate × Technology
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="card-subtle p-3 bg-white/10 backdrop-blur">
                    <div className="text-center">
                      <div className="text-xl mb-2">🏠</div>
                      <div>Industry Expertise</div>
                    </div>
                  </div>
                  <div className="card-subtle p-3 bg-white/10 backdrop-blur">
                    <div className="text-center">
                      <div className="text-xl mb-2">🤖</div>
                      <div>AI Innovation</div>
                    </div>
                  </div>
                  <div className="card-subtle p-3 bg-white/10 backdrop-blur">
                    <div className="text-center">
                      <div className="text-xl mb-2">🎯</div>
                      <div>Results Focus</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute top-4 right-4 card-subtle p-2 bg-white/10 backdrop-blur">
              <div className="text-xs text-white">Est. 2024</div>
            </div>
            <div className="absolute bottom-4 left-4 card-subtle p-2 bg-white/10 backdrop-blur">
              <div className="text-xs text-white">Based in Austin, TX</div>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="mt-20 animate-fade-up-delay-2">
        <h3 className="text-display-sm text-center mb-12">
          Our <span className="gradient-text">Values</span>
        </h3>
        
        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center card p-8 hover-lift">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-rivor-indigo/20 to-rivor-teal/20 flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">🎯</span>
            </div>
            <h4 className="font-semibold mb-3">Agent-First</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every feature is designed from the agent's perspective. We build tools that 
              solve real problems, not create new ones.
            </p>
          </div>

          <div className="text-center card p-8 hover-lift">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-rivor-teal/20 to-rivor-aqua/20 flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">🔒</span>
            </div>
            <h4 className="font-semibold mb-3">Privacy First</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your client data is sacred. We use minimal permissions and enterprise-grade 
              encryption to keep your information secure.
            </p>
          </div>

          <div className="text-center card p-8 hover-lift">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-rivor-aqua/20 to-rivor-indigo/20 flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">⚡</span>
            </div>
            <h4 className="font-semibold mb-3">Simplicity</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Powerful doesn't mean complicated. We believe the best tools feel 
              intuitive and get out of your way.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
