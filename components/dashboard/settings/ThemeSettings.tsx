'use client'

import { useState, useTransition } from 'react'
import { updateTheme } from '@/lib/actions/profile'
import { DEFAULT_THEME, type Theme } from '@/lib/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Toggle from '@/components/ui/Toggle'
import SectionOrder from './SectionOrder'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

const FONTS = ['inter', 'playfair', 'mono', 'nunito', 'lora'] as const
const SHADOW_OPTIONS = ['none', 'sm', 'md', 'lg'] as const
const ANIM_STYLES = ['none', 'fade', 'slide', 'pop'] as const
const ANIM_SPEEDS = ['slow', 'normal', 'fast'] as const

export default function ThemeSettings({ theme: initial, username }: { theme: Theme; username: string }) {
  const [theme, setTheme] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function set<K extends keyof Theme>(key: K, value: Theme[K]) {
    setTheme(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    startTransition(async () => {
      await updateTheme(theme)
      setSaved(true)
    })
  }

  function handleReset() {
    setTheme(DEFAULT_THEME)
    setSaved(false)
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Profile appearance</h2>
        {username && (
          <Link href={`/${username}`} target="_blank" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
            <ExternalLink size={11} />
            Preview
          </Link>
        )}
      </div>

      <div className="grid gap-4">
        {/* Background */}
        <SettingCard title="Background">
          <div className="space-y-3">
            <div className="flex gap-2">
              {(['solid', 'gradient', 'image'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => set('backgroundType', type)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors capitalize ${theme.backgroundType === type ? 'bg-[#7c6aff]/20 text-[#7c6aff]' : 'bg-white/5 text-white/50 hover:text-white/80'}`}
                >
                  {type}
                </button>
              ))}
            </div>
            {theme.backgroundType === 'solid' && (
              <ColorPicker label="Color" value={theme.backgroundColor} onChange={(v) => set('backgroundColor', v)} />
            )}
            {theme.backgroundType === 'gradient' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <ColorPicker label="From" value={theme.gradientFrom} onChange={(v) => set('gradientFrom', v)} />
                  <ColorPicker label="To" value={theme.gradientTo} onChange={(v) => set('gradientTo', v)} />
                </div>
                <Input
                  label="Direction"
                  value={theme.gradientDirection}
                  onChange={(e) => set('gradientDirection', e.target.value)}
                  placeholder="to bottom right"
                />
              </div>
            )}
            {theme.backgroundType === 'image' && (
              <Input
                label="Image URL"
                value={theme.backgroundImage}
                onChange={(e) => set('backgroundImage', e.target.value)}
                placeholder="https://…"
              />
            )}
          </div>
        </SettingCard>

        {/* Colors */}
        <SettingCard title="Colors">
          <div className="flex gap-4">
            <ColorPicker label="Accent" value={theme.accentColor} onChange={(v) => set('accentColor', v)} />
            <ColorPicker label="Text" value={theme.textColor} onChange={(v) => set('textColor', v)} />
          </div>
        </SettingCard>

        {/* Font */}
        <SettingCard title="Font">
          <div className="flex flex-wrap gap-2">
            {FONTS.map(f => (
              <button
                key={f}
                onClick={() => set('font', f)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors capitalize ${theme.font === f ? 'bg-[#7c6aff]/20 text-[#7c6aff]' : 'bg-white/5 text-white/50 hover:text-white/80'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </SettingCard>

        {/* Cards */}
        <SettingCard title="Cards">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-white/50 block mb-1.5">Border radius: {theme.cardBorderRadius}px</label>
              <input
                type="range" min={0} max={32} step={2}
                value={theme.cardBorderRadius}
                onChange={(e) => set('cardBorderRadius', Number(e.target.value))}
                className="w-full accent-[#7c6aff]"
              />
            </div>
            <ColorPicker label="Border color" value={theme.cardBorderColor} onChange={(v) => set('cardBorderColor', v)} />
            <div>
              <label className="text-xs text-white/50 block mb-1.5">Shadow</label>
              <div className="flex gap-2">
                {SHADOW_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => set('cardShadow', s)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-colors capitalize ${theme.cardShadow === s ? 'bg-[#7c6aff]/20 text-[#7c6aff]' : 'bg-white/5 text-white/50 hover:text-white/80'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <Toggle checked={theme.cardGlass} onChange={(v) => set('cardGlass', v)} label="Glassmorphism" />
          </div>
        </SettingCard>

        {/* Animations */}
        <SettingCard title="Animations">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-white/50 block mb-1.5">Style</label>
              <div className="flex gap-2">
                {ANIM_STYLES.map(a => (
                  <button
                    key={a}
                    onClick={() => set('animationStyle', a)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-colors capitalize ${theme.animationStyle === a ? 'bg-[#7c6aff]/20 text-[#7c6aff]' : 'bg-white/5 text-white/50 hover:text-white/80'}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1.5">Speed</label>
              <div className="flex gap-2">
                {ANIM_SPEEDS.map(s => (
                  <button
                    key={s}
                    onClick={() => set('animationSpeed', s)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-colors capitalize ${theme.animationSpeed === s ? 'bg-[#7c6aff]/20 text-[#7c6aff]' : 'bg-white/5 text-white/50 hover:text-white/80'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              label="Custom CSS animation (advanced)"
              placeholder="e.g. keyframes name or full @keyframes block"
              value={theme.customAnimation}
              onChange={(e) => set('customAnimation', e.target.value)}
              rows={2}
            />
          </div>
        </SettingCard>

        {/* Section order */}
        <SettingCard title="Section order">
          <SectionOrder order={theme.sectionOrder} onChange={(order) => set('sectionOrder', order)} />
        </SettingCard>

        {/* Custom CSS */}
        <SettingCard title="Custom CSS">
          <Textarea
            label="Injected into your public profile"
            placeholder=".my-brain-profile { /* your overrides */ }"
            value={theme.customCSS}
            onChange={(e) => set('customCSS', e.target.value)}
            rows={6}
            className="font-mono text-xs"
          />
        </SettingCard>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSave} loading={pending}>
          {saved ? '✓ Saved' : 'Save appearance'}
        </Button>
        <Button variant="ghost" onClick={handleReset} size="sm">
          Reset to defaults
        </Button>
      </div>
    </section>
  )
}

function SettingCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-5 rounded-xl bg-white/[0.03] border border-white/8">
      <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  )
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-white/50">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value.startsWith('#') ? value : '#7c6aff'}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono w-32 focus:outline-none focus:border-[#7c6aff]/60 transition-colors"
        />
      </div>
    </div>
  )
}
