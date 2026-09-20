import React from 'react';
import { Eye, Brain, Hand, Mic, CheckCircle2 } from 'lucide-react';

const PRESET_PROFILES = [
  {
    id: 'cognitive_motor',
    name: 'Cognitive + Motor',
    icon: Brain,
    description: 'One question at a time, plain language, minimal precision required, with confirmation before final submission.',
    profile: {
      visual: 'standard',
      motor: 'limited_mouse_control',
      cognitive: 'simplified_language',
      interaction: 'multimodal',
      confirm_before_submit: true,
      one_field_at_a_time: true,
      high_contrast: false
    }
  },
  {
    id: 'low_vision',
    name: 'Low Vision',
    icon: Eye,
    description: 'High contrast display, larger typography, plain descriptive labels, screen-reader optimized.',
    profile: {
      visual: 'high_contrast',
      motor: 'standard',
      cognitive: 'standard',
      interaction: 'text',
      confirm_before_submit: true,
      one_field_at_a_time: false,
      high_contrast: true
    }
  },
  {
    id: 'motor_assist',
    name: 'Motor Assistance',
    icon: Hand,
    description: 'Generous touch/click targets, keyboard navigation prioritized, voice-first input enabled.',
    profile: {
      visual: 'standard',
      motor: 'limited_mouse_control',
      cognitive: 'standard',
      interaction: 'voice',
      confirm_before_submit: true,
      one_field_at_a_time: true,
      high_contrast: false
    }
  },
  {
    id: 'voice_first',
    name: 'Voice-First Assistant',
    icon: Mic,
    description: 'Hands-free conversational completion with spoken field explanations and confirmations.',
    profile: {
      visual: 'standard',
      motor: 'tremor_assistance',
      cognitive: 'simplified_language',
      interaction: 'voice',
      confirm_before_submit: true,
      one_field_at_a_time: true,
      high_contrast: false
    }
  }
];

export default function ProfileSelector({ activeProfile, onSelectProfile, highContrast, onToggleContrast }) {
  return (
    <section aria-labelledby="profile-heading" className="bg-surface border border-border-custom rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 id="profile-heading" className="text-base font-bold text-text-primary flex items-center gap-2">
            Accessibility Profile
          </h2>
          <p className="text-xs text-text-muted">
            AccessBridge adapts field explanations, interaction pace, and input handling to your needs.
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleContrast}
          aria-pressed={highContrast}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all focus:outline-none focus:ring-2 focus:ring-accent ${
            highContrast
              ? 'bg-accent text-accent-fg border-accent'
              : 'bg-surface-secondary text-text-primary border-border-custom hover:bg-surface'
          }`}
        >
          {highContrast ? 'High Contrast: ON' : 'High Contrast: OFF'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5" role="radiogroup" aria-label="Select Accessibility Profile">
        {PRESET_PROFILES.map((preset) => {
          const Icon = preset.icon;
          const isSelected = activeProfile?.id === preset.id;
          return (
            <button
              key={preset.id}
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectProfile(preset)}
              className={`text-left p-3 rounded-xl border transition-all relative flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-accent ${
                isSelected
                  ? 'border-accent bg-accent/10 shadow-sm ring-1 ring-accent'
                  : 'border-border-custom bg-surface-secondary hover:border-text-muted'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5 font-bold text-xs text-text-primary">
                    <Icon className="w-4 h-4 text-accent" aria-hidden="true" />
                    {preset.name}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-accent" aria-hidden="true" />
                  )}
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  {preset.description}
                </p>
              </div>
              <div className="mt-2 pt-2 border-t border-border-custom/50 flex items-center gap-2 text-[10px] text-text-muted font-mono">
                <span className="bg-surface px-1.5 py-0.5 rounded border border-border-custom">
                  {preset.profile.cognitive === 'simplified_language' ? 'Plain Lang' : 'Standard'}
                </span>
                <span className="bg-surface px-1.5 py-0.5 rounded border border-border-custom">
                  {preset.profile.interaction}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
