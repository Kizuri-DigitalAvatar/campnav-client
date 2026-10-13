"use client"

import { useId, type ReactNode } from "react"
import { useQuery } from "convex-helpers/react/cache"
import { Clock, Headset, MessageCircle, Phone } from "lucide-react"

import { api } from "../../convex/_generated/api"
import { useAuth } from "@/components/auth-provider"

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"

// Links that hand off to the phone's dialler and to WhatsApp
export function useReceptionLinks() {
  const { user } = useAuth()
  const contact = useQuery(api.settings.getReceptionContact)

  const telHref = contact?.phone ? `tel:${contact.phone.replace(/[^\d+]/g, "")}` : null
  const waDigits = contact?.whatsapp?.replace(/\D/g, "")
  const greeting = user
    ? `Hi Reception, this is ${user.name}${user.roomNumber ? ` from Room ${user.roomNumber}` : ""}. `
    : "Hi Reception, "
  const whatsappHref = waDigits ? `https://wa.me/${waDigits}?text=${encodeURIComponent(greeting)}` : null

  return { loading: contact === undefined, telHref, whatsappHref, hours: contact?.hours ?? null, phone: contact?.phone ?? null }
}

function CallButton({ href, compact }: { href: string; compact?: boolean }) {
  return (
    <a
      href={href}
      aria-label="Call reception"
      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-95 ${compact ? "h-9 px-3 text-xs" : "h-11 px-4 text-sm"} ${focusRing}`}
    >
      <Phone className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden />
      Call
    </a>
  )
}

function WhatsAppButton({ href, compact }: { href: string; compact?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Message reception on WhatsApp (opens WhatsApp)"
      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] font-semibold text-[#073b1c] shadow-sm transition-all hover:brightness-95 active:scale-95 ${compact ? "h-9 px-3 text-xs" : "h-11 px-4 text-sm"} ${focusRing}`}
    >
      <MessageCircle className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden />
      WhatsApp
    </a>
  )
}

// Full card: dashboard panel / service pages
export function ReceptionContactCard({ className = "", fallback = null }: { className?: string; fallback?: ReactNode }) {
  const { loading, telHref, whatsappHref, hours } = useReceptionLinks()
  const titleId = useId()
  if (loading) return null
  if (!telHref && !whatsappHref) return <>{fallback}</>

  return (
    <section aria-labelledby={titleId} className={`glass-card p-4 md:p-5 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="tile-3d flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-primary">
          <Headset className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 id={titleId} className="text-sm font-bold">Need help? Contact reception</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Call or message the front desk directly.</p>
          {hours && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-foreground">
              <Clock className="h-3 w-3" aria-hidden /> {hours}
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        {telHref && <CallButton href={telHref} />}
        {whatsappHref && <WhatsAppButton href={whatsappHref} />}
      </div>
    </section>
  )
}

// Compact buttons: sidebar support box
export function ReceptionContactButtons() {
  const { loading, telHref, whatsappHref } = useReceptionLinks()
  if (loading || (!telHref && !whatsappHref)) return null
  return (
    <div className="flex gap-2" role="group" aria-label="Contact reception">
      {telHref && <CallButton href={telHref} compact />}
      {whatsappHref && <WhatsAppButton href={whatsappHref} compact />}
    </div>
  )
}
