"use client"

import { useState } from "react"
import Link from "next/link"
import { useMutation } from "convex/react"
import { ArrowRight, Check, Loader2, Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CAMP_SIZES, CONTACT, INTERESTS } from "@/components/marketing/content"
import { api } from "../../../convex/_generated/api"
import { cn } from "@/lib/utils"

type Errors = Partial<Record<"fullName" | "workEmail" | "company", string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground"

export function DemoForm() {
    const createDemoRequest = useMutation(api.demoRequests.create)

    const [form, setForm] = useState({
        fullName: "",
        workEmail: "",
        company: "",
        phone: "",
        jobTitle: "",
        campSize: "",
        preferredTime: "",
        message: "",
    })
    const [interests, setInterests] = useState<string[]>([])
    const [errors, setErrors] = useState<Errors>({})
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const set = (key: keyof typeof form) => (value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }))
        setErrors((prev) => ({ ...prev, [key]: undefined }))
    }

    const toggleInterest = (interest: string) =>
        setInterests((prev) =>
            prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
        )

    const validate = () => {
        const next: Errors = {}
        if (form.fullName.trim().length < 2) next.fullName = "Please enter your full name."
        if (!EMAIL_RE.test(form.workEmail.trim())) next.workEmail = "Please enter a valid work email."
        if (form.company.trim().length < 2) next.company = "Please enter your company or camp name."
        setErrors(next)
        return Object.keys(next).length === 0
    }

    const onSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (submitting) return
        if (!validate()) {
            toast.error("Please check the highlighted fields.")
            return
        }

        setSubmitting(true)
        try {
            await createDemoRequest({
                fullName: form.fullName.trim(),
                workEmail: form.workEmail.trim(),
                company: form.company.trim(),
                phone: form.phone.trim() || undefined,
                jobTitle: form.jobTitle.trim() || undefined,
                campSize: form.campSize || undefined,
                interests: interests.length ? interests : undefined,
                message: form.message.trim() || undefined,
                preferredTime: form.preferredTime.trim() || undefined,
                source: "landing",
            })
            setSubmitted(true)
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Something went wrong. Please try again."
            toast.error(message.replace(/^\[.*?\]\s*/, ""))
        } finally {
            setSubmitting(false)
        }
    }

    if (submitted) {
        return (
            <div className="ring-gradient rounded-3xl border bg-card p-8 text-center shadow-float md:p-12">
                <span className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                    <Check className="size-8" strokeWidth={3} />
                </span>
                <h2 className="mt-6 text-2xl font-black tracking-tight">
                    Thanks, {form.fullName.split(" ")[0]} — request received.
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                    We have sent a confirmation to <strong className="text-foreground">{form.workEmail}</strong>.
                    A member of the team will be in touch within one business day to schedule your
                    walkthrough.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <Button asChild variant="outline" className="rounded-full">
                        <Link href="/">Back to the site</Link>
                    </Button>
                    <Button asChild className="rounded-full">
                        <Link href="/login">
                            Log in
                            <ArrowRight className="size-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <form
            onSubmit={onSubmit}
            noValidate
            className="ring-gradient rounded-3xl border bg-card p-6 shadow-float md:p-8"
        >
            <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-1">
                    <label htmlFor="fullName" className={labelClass}>
                        Full name <span className="text-destructive">*</span>
                    </label>
                    <Input
                        id="fullName"
                        name="fullName"
                        autoComplete="name"
                        placeholder="Aminata Kamara"
                        className="h-11"
                        value={form.fullName}
                        aria-invalid={!!errors.fullName}
                        aria-describedby={errors.fullName ? "fullName-error" : undefined}
                        onChange={(e) => set("fullName")(e.target.value)}
                    />
                    {errors.fullName && (
                        <p id="fullName-error" className="mt-1.5 text-xs font-medium text-destructive">
                            {errors.fullName}
                        </p>
                    )}
                </div>

                <div className="sm:col-span-1">
                    <label htmlFor="workEmail" className={labelClass}>
                        Work email <span className="text-destructive">*</span>
                    </label>
                    <Input
                        id="workEmail"
                        name="workEmail"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="you@company.com"
                        className="h-11"
                        value={form.workEmail}
                        aria-invalid={!!errors.workEmail}
                        aria-describedby={errors.workEmail ? "workEmail-error" : undefined}
                        onChange={(e) => set("workEmail")(e.target.value)}
                    />
                    {errors.workEmail && (
                        <p id="workEmail-error" className="mt-1.5 text-xs font-medium text-destructive">
                            {errors.workEmail}
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="company" className={labelClass}>
                        Company / camp <span className="text-destructive">*</span>
                    </label>
                    <Input
                        id="company"
                        name="company"
                        autoComplete="organization"
                        placeholder="Kizuri Camp Services"
                        className="h-11"
                        value={form.company}
                        aria-invalid={!!errors.company}
                        aria-describedby={errors.company ? "company-error" : undefined}
                        onChange={(e) => set("company")(e.target.value)}
                    />
                    {errors.company && (
                        <p id="company-error" className="mt-1.5 text-xs font-medium text-destructive">
                            {errors.company}
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="jobTitle" className={labelClass}>
                        Your role
                    </label>
                    <Input
                        id="jobTitle"
                        name="jobTitle"
                        autoComplete="organization-title"
                        placeholder="Camp manager"
                        className="h-11"
                        value={form.jobTitle}
                        onChange={(e) => set("jobTitle")(e.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="phone" className={labelClass}>
                        Phone
                    </label>
                    <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="+232 00 000 000"
                        className="h-11"
                        value={form.phone}
                        onChange={(e) => set("phone")(e.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="campSize" className={labelClass}>
                        Camp size
                    </label>
                    <select
                        id="campSize"
                        name="campSize"
                        value={form.campSize}
                        onChange={(e) => set("campSize")(e.target.value)}
                        className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-[inset_0_1px_2px_rgb(16_24_40_/_0.04)] outline-none transition-[color,box-shadow,border-color] focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15"
                    >
                        <option value="">Select a range</option>
                        {CAMP_SIZES.map((size) => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="sm:col-span-2">
                    <span className={labelClass}>Most interested in</span>
                    <div className="flex flex-wrap gap-2">
                        {INTERESTS.map((interest) => {
                            const selected = interests.includes(interest)
                            return (
                                <button
                                    key={interest}
                                    type="button"
                                    onClick={() => toggleInterest(interest)}
                                    aria-pressed={selected}
                                    className={cn(
                                        "rounded-full border px-3.5 py-2 text-xs font-semibold transition-all duration-200 outline-none focus-visible:ring-4 focus-visible:ring-ring/25",
                                        selected
                                            ? "border-primary/40 bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                                    )}
                                >
                                    {selected && <Check className="mr-1 inline size-3" strokeWidth={3} />}
                                    {interest}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="preferredTime" className={labelClass}>
                        Preferred time for the demo
                    </label>
                    <Input
                        id="preferredTime"
                        name="preferredTime"
                        placeholder="e.g. weekday mornings, GMT"
                        className="h-11"
                        value={form.preferredTime}
                        onChange={(e) => set("preferredTime")(e.target.value)}
                    />
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="message" className={labelClass}>
                        Anything we should know?
                    </label>
                    <textarea
                        id="message"
                        name="message"
                        rows={4}
                        placeholder="Tell us about your site — number of blocks, departments, what is causing the most friction today."
                        value={form.message}
                        onChange={(e) => set("message")(e.target.value)}
                        className="w-full resize-y rounded-lg border border-input bg-card px-3 py-2.5 text-sm leading-relaxed shadow-[inset_0_1px_2px_rgb(16_24_40_/_0.04)] outline-none transition-[color,box-shadow,border-color] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15"
                    />
                </div>
            </div>

            <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="mt-7 h-12 w-full rounded-full text-base"
            >
                {submitting ? (
                    <>
                        <Loader2 className="size-4 animate-spin" />
                        Sending request…
                    </>
                ) : (
                    <>
                        <Send className="size-4" />
                        Request my demo
                    </>
                )}
            </Button>

            <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
                {CONTACT.responsePromise} We only use these details to arrange your demo.
            </p>
        </form>
    )
}
