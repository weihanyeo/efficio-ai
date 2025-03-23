'use client';
import React from 'react';
import { useRouter } from "next/navigation";
import { Bot, ArrowRight, Sparkles, Brain, Zap, Table2, Layout, GitPullRequest, Bot as BotIcon, Terminal, Users, Star, CheckCircle2 } from 'lucide-react';

export const LandingPage = () => {
  const navigate = useRouter();

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0D0D0D]/80 backdrop-blur-lg border-b border-[#262626]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-indigo-400" />
            <span className="text-xl font-bold">Efficio.AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</a>
            <button
              onClick={() => navigate.push('/auth')}
              className="px-4 py-2 bg-indigo-600 text-sm rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <div className="absolute -left-32 -top-32 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
            <div className="absolute right-32 bottom-16 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
            
            <div className="relative text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#161616] rounded-full border border-[#363636] mb-6">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-sm">Issue Tracking, Reimagined</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-gray-300 text-transparent bg-clip-text">
                Smart Issue Tracking.<br />AI-Powered Insights.
              </h1>
              
              <p className="text-xl text-gray-400 mb-10">
                Track issues, manage projects, and collaborate seamlessly with AI assistance that understands your development workflow.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => navigate.push('/auth')}
                  className="w-full sm:w-auto px-8 py-3 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto px-8 py-3 bg-[#161616] border border-[#363636] rounded-lg hover:bg-[#262626] transition-colors flex items-center justify-center gap-2"
                >
                  See How It Works
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 bg-[#0F0F0F]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Teams Love Efficio.AI</h2>
            <p className="text-gray-400">Powerful features that make project management a breeze</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Table2 className="w-6 h-6 text-indigo-400" />,
                title: "Familiar Interface",
                description: "Work with an intuitive, spreadsheet-style grid that feels just like Excel."
              },
              {
                icon: <Layout className="w-6 h-6 text-purple-400" />,
                title: "Visual Workflows",
                description: "Switch seamlessly between grid and Kanban views to manage your way."
              },
              {
                icon: <Brain className="w-6 h-6 text-indigo-400" />,
                title: "AI Assistant",
                description: "Smart issue categorization and automated task breakdown."
              },
              {
                icon: <Terminal className="w-6 h-6 text-purple-400" />,
                title: "Code Context",
                description: "Automatic code change tracking and PR integration."
              },
              {
                icon: <Sparkles className="w-6 h-6 text-blue-400" />,
                title: "Smart Workflows",
                description: "Automated issue updates and status tracking."
              },
              {
                icon: <Zap className="w-6 h-6 text-yellow-400" />,
                title: "Team Insights",
                description: "AI-powered progress tracking and workload analysis."
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-gradient-to-br from-[#161616] to-[#1A1A1A] rounded-xl border border-[#262626] hover:border-[#363636] transition-all group"
              >
                <div className="p-3 bg-[#1E1E1E] rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400">Get started in minutes, not months</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Import Your Data",
                description: "Import from Excel, CSV, or connect to your existing tools. Our AI assistant helps map and organize your data."
              },
              {
                step: "02",
                title: "Customize Your Views",
                description: "Set up your perfect workflow with custom views, filters, and automations that work for your team."
              },
              {
                step: "03",
                title: "Start Collaborating",
                description: "Invite your team and start working together with real-time updates and smart notifications."
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="absolute -left-4 -top-4 text-4xl font-bold text-indigo-500/20">
                  {item.step}
                </div>
                <div className="p-6 bg-[#161616] rounded-xl border border-[#262626]">
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-[#0F0F0F]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Loved by Teams Worldwide</h2>
            <p className="text-gray-400">Join thousands of teams already using Efficio.AI</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "Finally, a tool that combines the flexibility of Excel with the power of a full PM system. Our productivity has skyrocketed!",
                author: "Alex R.",
                role: "Product Manager",
                rating: 5
              },
              {
                quote: "The AI automation is a game changer. It's like having a personal assistant that never sleeps.",
                author: "Jamie L.",
                role: "Team Lead",
                rating: 5
              },
              {
                quote: "Switching from Jira was the best decision we made. Efficio.AI is simpler, faster, and more intuitive.",
                author: "Sarah M.",
                role: "Engineering Manager",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} className="p-6 bg-[#161616] rounded-xl border border-[#262626]">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-lg mb-6">"{testimonial.quote}"</p>
                <div>
                  <p className="font-medium">{testimonial.author}</p>
                  <p className="text-sm text-gray-400">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-[#0F0F0F]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#161616] rounded-full border border-[#363636] mb-6">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm">Special Launch Offer</span>
          </div>
          
          <h2 className="text-3xl font-bold mb-4">Free for a Limited Time</h2>
          <p className="text-xl text-gray-400 mb-8">
            Get full access to all features during our launch period. No credit card required.
          </p>
          
          <div className="p-8 bg-gradient-to-b from-[#161616] to-[#1A1A1A] rounded-xl border border-[#262626]">
            <div className="flex items-baseline justify-center gap-2 mb-6">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-gray-400">/month</span>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>All Pro Features</span>
              </li>
              <li className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>Unlimited Projects</span>
              </li>
              <li className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>Unlimited Team Members</span>
              </li>
              <li className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>Priority Support</span>
              </li>
            </ul>
            
            <button
              onClick={() => navigate.push('/auth')}
              className="w-full px-8 py-3 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              Get Started Now
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <p className="mt-4 text-sm text-gray-400">
              Limited time offer. Regular pricing will apply after launch period.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Workflow?</h2>
          <p className="text-xl text-gray-400 mb-10">
            Join thousands of teams who've already made the switch to simpler, smarter project management.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate.push('/auth')}
              className="w-full sm:w-auto px-8 py-3 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#pricing"
              className="w-full sm:w-auto px-8 py-3 bg-[#161616] border border-[#363636] rounded-lg hover:bg-[#262626] transition-colors flex items-center justify-center gap-2"
            >
              View Pricing
            </a>
          </div>
          <div className="flex items-center justify-center gap-4 mt-8 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-[#0F0F0F] border-t border-[#262626]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Bot className="w-8 h-8 text-indigo-400" />
                <span className="text-xl font-bold">Efficio.AI</span>
              </div>
              <p className="text-gray-400">
                Project management reimagined.<br />Simple. Powerful. Intelligent.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white">Pricing</a></li>
                <li><a href="#roadmap" className="text-gray-400 hover:text-white">Roadmap</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#about" className="text-gray-400 hover:text-white">About</a></li>
                <li><a href="#blog" className="text-gray-400 hover:text-white">Blog</a></li>
                <li><a href="#careers" className="text-gray-400 hover:text-white">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#docs" className="text-gray-400 hover:text-white">Documentation</a></li>
                <li><a href="#help" className="text-gray-400 hover:text-white">Help Center</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-[#262626] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">
              © 2024 Efficio.AI. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#privacy" className="text-sm text-gray-400 hover:text-white">Privacy</a>
              <a href="#terms" className="text-sm text-gray-400 hover:text-white">Terms</a>
              <a href="#security" className="text-sm text-gray-400 hover:text-white">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};