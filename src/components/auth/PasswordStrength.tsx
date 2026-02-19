"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'

interface PasswordStrengthProps {
  password: string
  className?: string
}

interface StrengthLevel {
  level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong'
  text: string
  color: string
  barColor: string
  segments: number
}

interface RequirementCheck {
  met: boolean
  text: string
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({
  password,
  className
}) => {
  const calculateStrength = (password: string): StrengthLevel => {
    if (!password) {
      return {
        level: 'very-weak',
        text: '',
        color: '',
        barColor: '',
        segments: 0
      }
    }

    let score = 0
    
    // Length check
    if (password.length >= 8) score += 1
    if (password.length >= 12) score += 1
    
    // Character variety checks
    if (/[a-z]/.test(password)) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1

    // Determine strength level
    if (score <= 2) {
      return {
        level: 'very-weak',
        text: 'Very weak',
        color: 'text-red-600',
        barColor: 'bg-red-500',
        segments: 1
      }
    } else if (score === 3) {
      return {
        level: 'weak',
        text: 'Weak',
        color: 'text-orange-600',
        barColor: 'bg-orange-500',
        segments: 2
      }
    } else if (score === 4) {
      return {
        level: 'fair',
        text: 'Fair',
        color: 'text-yellow-600',
        barColor: 'bg-yellow-500',
        segments: 3
      }
    } else if (score === 5) {
      return {
        level: 'good',
        text: 'Good',
        color: 'text-emerald-600',
        barColor: 'bg-emerald-500',
        segments: 4
      }
    } else {
      return {
        level: 'strong',
        text: 'Strong',
        color: 'text-green-600',
        barColor: 'bg-green-600',
        segments: 5
      }
    }
  }

  const getRequirements = (password: string): RequirementCheck[] => {
    return [
      {
        met: password.length >= 8,
        text: 'At least 8 characters'
      },
      {
        met: /[a-z]/.test(password),
        text: 'Lowercase letter (a-z)'
      },
      {
        met: /[A-Z]/.test(password),
        text: 'Uppercase letter (A-Z)'
      },
      {
        met: /[0-9]/.test(password),
        text: 'Number (0-9)'
      },
      {
        met: /[^A-Za-z0-9]/.test(password),
        text: 'Special character (!@#$%^&*)'
      }
    ]
  }

  const strength = calculateStrength(password)
  const requirements = getRequirements(password)

  if (!password) return null

  return (
    <div className={cn("mt-3 space-y-3", className)}>
      {/* Strength bars */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-gray-700">Password strength</span>
          <span className={cn("text-xs font-semibold", strength.color)}>
            {strength.text}
          </span>
        </div>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((segment) => (
            <div
              key={segment}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-200",
                segment <= strength.segments
                  ? strength.barColor
                  : "bg-gray-200"
              )}
            />
          ))}
        </div>
      </div>
      
      {/* Requirements checklist */}
      <div className="space-y-1 grid grid-cols-1 sm:grid-cols-2 gap-1">
        {requirements.map((req, idx) => (
          <div key={idx} className="flex items-center gap-2 text-[9px]">
            {req.met ? (
              <Check className="w-3 h-3 text-green-600 shrink-0" />
            ) : (
              <X className="w-3 h-3 text-gray-300 shrink-0" />
            )}
            <span
              className={cn(
                "transition-colors duration-200",
                req.met ? "text-gray-700 font-medium" : "text-gray-500"
              )}
            >
              {req.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export { PasswordStrength, type PasswordStrengthProps }