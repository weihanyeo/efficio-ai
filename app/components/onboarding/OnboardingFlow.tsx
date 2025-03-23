"use client";
import React from 'react';
import { useRouter } from "next/navigation";
import { Bot, Rocket, Users, Briefcase, ArrowRight, Check, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { supabase } from '../../lib/supabase';

interface OnboardingStep {
  title: string;
  description: string;
}

const steps: OnboardingStep[] = [
  {
    title: 'Welcome to Efficio.AI',
    description: "Let's get your workspace set up in just a few steps"
  },
  {
    title: 'Create Your Workspace',
    description: 'Set up your team workspace'
  },
  {
    title: 'Invite Your Team',
    description: 'Work better together'
  },
  {
    title: "You're All Set!",
    description: 'Ready to get started'
  }
];

export const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [workspaceName, setWorkspaceName] = React.useState('');
  const [workspaceType, setWorkspaceType] = React.useState<'personal' | 'team'>('team');
  const [teamSize, setTeamSize] = React.useState<string>('');
  const [teamEmails, setTeamEmails] = React.useState('');
  const { user, completeOnboarding } = useAuth();
  const { createWorkspace } = useWorkspace();
  const navigate = useRouter();

  const handleSubmit = async () => {
    if (currentStep === steps.length - 1) {
      await completeOnboarding();
      // Final step - redirect to dashboard
      navigate.push('/dashboard');
      return;
    }

    if (currentStep === 1) {
      try {
        await createWorkspace(workspaceName, workspaceType);
      } catch (error) {
        console.error('Error creating workspace:', error);
        return;
      }
    }

    if (currentStep === 2 && teamEmails) {
      // Handle team invites
      const emails = teamEmails.split(',').map(email => email.trim());
      // You would implement the invite logic here
    }

    setCurrentStep(prev => prev + 1);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Rocket className="w-8 h-8 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Welcome to Efficio.AI!</h2>
            <p className="text-gray-300 mb-8">
              We're excited to help you and your team work more efficiently.
              Let's get your workspace set up in just a few steps.
            </p>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6">
              <Briefcase className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Workspace Name</label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-indigo-500"
                placeholder="e.g., Engineering Team"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Workspace Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setWorkspaceType('personal')}
                  className={`p-4 rounded-lg border ${
                    workspaceType === 'personal'
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-border hover:border-indigo-500/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <User className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h3 className="font-medium text-foreground mb-1">Personal</h3>
                    <p className="text-sm text-gray-400">Just for yourself</p>
                  </div>
                </button>
                <button
                  onClick={() => setWorkspaceType('team')}
                  className={`p-4 rounded-lg border ${
                    workspaceType === 'team'
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-border hover:border-indigo-500/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Users className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h3 className="font-medium text-foreground mb-1">Team</h3>
                    <p className="text-sm text-gray-400">Collaborate with others</p>
                  </div>
                </button>
              </div>
            </div>
            {workspaceType === 'team' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Team Size</label>
                <select
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select team size</option>
                  <option value="2-5">2-5 people</option>
                  <option value="6-10">6-10 people</option>
                  <option value="11-25">11-25 people</option>
                  <option value="26+">26+ people</option>
                </select>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6">
              <Users className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Invite Team Members</label>
              <textarea
                value={teamEmails}
                onChange={(e) => setTeamEmails(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-indigo-500"
                placeholder="Enter email addresses separated by commas"
              />
              <p className="mt-2 text-sm text-gray-400">
                You can also invite team members later
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">You're All Set!</h2>
            <p className="text-gray-300 mb-8">
              Your workspace is ready. Let's start working smarter together.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex">
      {/* Left Panel - Progress */}
      <div className="w-80 border-r border-muted p-8">
        <div className="flex items-center gap-3 mb-12">
          <Bot className="w-10 h-10 text-indigo-400" />
          <h1 className="text-2xl font-bold text-foreground">Efficio.AI</h1>
        </div>

        <div className="space-y-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                index <= currentStep ? 'text-foreground' : 'text-gray-500'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  index < currentStep
                    ? 'bg-green-500'
                    : index === currentStep
                    ? 'bg-indigo-500'
                    : 'bg-muted'
                }`}
              >
                {index < currentStep ? (
                  <Check className="w-4 h-4 text-foreground" />
                ) : (
                  <span className="text-sm">{index + 1}</span>
                )}
              </div>
              <div>
                <h3 className="font-medium text-foreground">{step.title}</h3>
                <p className="text-sm text-gray-400 mt-1">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-lg">
          {renderStepContent()}
          
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-indigo-600 text-foreground rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              {currentStep === steps.length - 1 ? (
                'Go to Dashboard'
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};