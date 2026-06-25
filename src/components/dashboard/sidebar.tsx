'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Radio, Users, Map, FileText, Target,
  Megaphone, Activity, Settings, X, Menu, Globe,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface NavSection {
  id: string
  label: string
  icon: React.ReactNode
  description?: string
}

const SECTIONS: NavSection[] = [
  { id: 'overview', label: 'نظرة عامة', icon: <LayoutDashboard className="h-4 w-4" />, description: 'المؤشرات الرئيسية' },
  { id: 'live', label: 'البث المباشر', icon: <Radio className="h-4 w-4" />, description: 'الزوار النشطون الآن' },
  { id: 'audience', label: 'الجمهور', icon: <Users className="h-4 w-4" />, description: 'الدول والأجهزة' },
  { id: 'behavior', label: 'السلوك', icon: <FileText className="h-4 w-4" />, description: 'الصفحات والمسارات' },
  { id: 'conversions', label: 'التحويلات', icon: <Target className="h-4 w-4" />, description: 'مسار التحويل' },
  { id: 'campaigns', label: 'الحملات', icon: <Megaphone className="h-4 w-4" />, description: 'مصادر الزيارات' },
]

interface SidebarProps {
  activeSection: string
  onSectionChange: (id: string) => void
  liveCount: number
  liveConnected: boolean
}

export function Sidebar({ activeSection, onSectionChange, liveCount, liveConnected }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  // إغلاق الـ sidebar على الموبايل عند تغيير القسم
  const handleSectionClick = (id: string) => {
    onSectionChange(id)
    setMobileOpen(false)
    // scroll إلى القسم
    setTimeout(() => {
      const el = document.getElementById(`section-${id}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  // إغلاق عند الضغط خارج الـ sidebar على الموبايل
  useEffect(() => {
    if (!mobileOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [mobileOpen])

  return (
    <>
      {/* زر فتح الـ sidebar على الموبايل */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 right-3 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card shadow-sm md:hidden"
        aria-label="فتح القائمة"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* خلفية معتمة على الموبايل */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* الـ sidebar نفسها */}
      <aside
        className={cn(
          'fixed right-0 top-0 z-50 flex h-screen w-72 flex-col border-l border-border bg-card transition-transform duration-300 md:sticky md:top-0 md:z-30 md:h-screen md:translate-x-0',
          mobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        )}
      >
        {/* الترويسة */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <svg viewBox="0 0 40 40" fill="none" className="h-5 w-5">
                <rect x="8" y="12" width="24" height="22" rx="2" fill="currentColor" />
                <rect x="12" y="16" width="4" height="4" rx="0.5" fill="var(--card)" />
                <rect x="18" y="16" width="4" height="4" rx="0.5" fill="var(--card)" />
                <rect x="24" y="16" width="4" height="4" rx="0.5" fill="var(--card)" />
                <rect x="17" y="27" width="6" height="7" rx="1" fill="#D4A853" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight text-foreground">صدى العقار</h1>
              <p className="text-[10px] text-muted-foreground leading-tight">لوحة التحليلات</p>
            </div>
          </div>
          {/* زر إغلاق على الموبايل */}
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted md:hidden"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* مؤشر Live */}
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className={cn(
                'relative flex h-2 w-2',
                liveCount > 0 && liveConnected && 'live-dot'
              )}>
                <span className={cn(
                  'absolute inline-flex h-full w-full rounded-full opacity-75',
                  liveCount > 0 && liveConnected ? 'bg-emerald-500' : 'bg-gray-400'
                )} />
                <span className={cn(
                  'relative inline-flex h-2 w-2 rounded-full',
                  liveCount > 0 && liveConnected ? 'bg-emerald-500' : 'bg-gray-400'
                )} />
              </span>
              <span className="text-xs font-medium text-foreground">زائر نشط الآن</span>
            </div>
            <span className="text-sm font-bold text-emerald-600">{liveCount}</span>
          </div>
        </div>

        {/* روابط التنقل */}
        <nav className="flex-1 overflow-y-auto p-3 custom-scroll">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase text-muted-foreground">
            الأقسام
          </p>
          <ul className="space-y-1">
            {SECTIONS.map((section) => {
              const isActive = activeSection === section.id
              return (
                <li key={section.id}>
                  <button
                    onClick={() => handleSectionClick(section.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-right transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <span className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-md',
                      isActive ? 'bg-primary-foreground/20' : 'bg-muted'
                    )}>
                      {section.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight">{section.label}</p>
                      {section.description && (
                        <p className={cn(
                          'text-[10px] leading-tight',
                          isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        )}>
                          {section.description}
                        </p>
                      )}
                    </div>
                    {section.id === 'live' && liveCount > 0 && (
                      <span className={cn(
                        'flex h-2 w-2 rounded-full',
                        isActive ? 'bg-primary-foreground' : 'bg-emerald-500 live-dot'
                      )} />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* التذييل */}
        <div className="border-t border-border p-3">
          <a
            href="https://sada-elaqar.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Globe className="h-3.5 w-3.5" />
            زيارة الموقع
          </a>
        </div>
      </aside>
    </>
  )
}
