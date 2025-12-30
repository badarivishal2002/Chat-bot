'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTheme } from '@/lib/theme-context'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  User,
  Palette,
  ChevronDown,
  Plug
} from 'lucide-react'
import { UserIntegrations } from '@/components/user-integrations'

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('profile')
  const [fullName, setFullName] = useState(session?.user?.name || '')
  const [email, setEmail] = useState(session?.user?.email || '')
  const [personalPreferences, setPersonalPreferences] = useState('')

  const settingsTabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'integrations', label: 'Integrations', icon: Plug },
  ]

  const handleSaveChanges = () => {
    alert('Changes saved successfully!')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] p-0 gap-0">
        <div className="flex h-full max-h-[85vh]">
          {/* Left Navigation */}
          <div className="w-48 border-r bg-muted/30 p-4 flex flex-col">
            <DialogHeader className="mb-4 px-0">
              <DialogTitle className="text-lg">Settings</DialogTitle>
            </DialogHeader>

            <nav className="space-y-1 flex-1">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Right Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Profile</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Full Name
                    </label>
                    <Input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Personal Preferences
                    </label>
                    <textarea
                      value={personalPreferences}
                      onChange={(e) => setPersonalPreferences(e.target.value)}
                      className="w-full h-24 px-3 py-2 border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="e.g. Keep brief and concise responses and use bullet points"
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleSaveChanges}
                      className="bg-blue-400 hover:bg-blue-500 text-white"
                    >
                      Save changes
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Appearance</h2>

                <div className="border rounded-lg p-4 bg-muted/30">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Theme
                    </label>
                    <div className="relative">
                      <select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                        className="w-full border rounded-md px-3 py-2 appearance-none pr-10 bg-background"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none text-muted-foreground" />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleSaveChanges}
                      className="bg-blue-400 hover:bg-blue-500 text-white"
                    >
                      Save changes
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <UserIntegrations />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
