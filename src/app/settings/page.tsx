"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { useAuth } from "@/components/auth-provider"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { User, Mail, Camera, Save, X, Edit2 } from "lucide-react"

export default function SettingsPage() {
    const { user, setUser } = useAuth()
    const updateUser = useMutation(api.users.updateProfile)
    const generateUploadUrl = useMutation(api.images.generateUploadUrl)

    const [isEditing, setIsEditing] = useState(false)
    const [name, setName] = useState(user?.name || "")
    const [email, setEmail] = useState(user?.email || "")
    const [uploading, setUploading] = useState(false)
    const [saving, setSaving] = useState(false)

    if (!user) return null

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setUploading(true)
            const uploadUrl = await generateUploadUrl()

            const result = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            })

            const { storageId } = await result.json()

            const updatedUser = await updateUser({
                userId: user._id,
                name: user.name,
                email: user.email,
                image: storageId,
            })

            // Fetch the image URL from Convex
            const imageUrl = await fetch(`https://api.convex.dev/api/storage/${storageId}`).then(r => r.url)

            setUser({ ...user, image: imageUrl || storageId })
            alert("Profile image updated!")
        } catch (error: any) {
            console.error("Upload failed:", error)
            if (error?.message?.includes("User not found")) {
                alert("Session expired. Please log in again.")
                window.location.href = "/login"
            } else {
                alert("Failed to upload image")
            }
        } finally {
            setUploading(false)
        }
    }

    const handleSaveProfile = async () => {
        try {
            setSaving(true)
            await updateUser({
                userId: user._id,
                name,
                email,
                image: user.image,
            })

            setUser({ ...user, name, email })
            setIsEditing(false)
            alert("Profile updated successfully!")
        } catch (error: any) {
            console.error("Save failed:", error)
            if (error?.message?.includes("User not found")) {
                alert("Session expired. Please log in again.")
                window.location.href = "/login"
            } else {
                alert("Failed to update profile")
            }
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        setName(user.name)
        setEmail(user.email)
        setIsEditing(false)
    }

    return (
        <div className="space-y-6 pb-20 md:pb-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Settings</h1>
                {!isEditing && (
                    <Button
                        onClick={() => setIsEditing(true)}
                        variant="outline"
                        className="gap-2"
                    >
                        <Edit2 size={16} />
                        Edit Profile
                    </Button>
                )}
            </div>

            {/* Profile Section */}
            <Card className="overflow-hidden rounded-3xl border bg-card/50 backdrop-blur-sm p-6">
                <h2 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-4">
                    Profile Information
                </h2>

                <div className="flex flex-col items-center gap-6 mb-6">
                    {/* Profile Image */}
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center border-4 border-background shadow-lg">
                            {user.image ? (
                                <img
                                    src={user.image}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User size={40} className="text-muted-foreground" />
                            )}
                        </div>

                        <label
                            htmlFor="profile-image-upload"
                            className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-lg"
                        >
                            {uploading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Camera size={16} />
                            )}
                        </label>
                        <input
                            id="profile-image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploading}
                        />
                    </div>

                    {/* Profile Fields */}
                    <div className="w-full space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                                <User size={14} />
                                Full Name
                            </label>
                            {isEditing ? (
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="rounded-xl"
                                />
                            ) : (
                                <p className="text-base font-semibold px-3 py-2 bg-muted/30 rounded-xl">
                                    {user.name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                                <Mail size={14} />
                                Email Address
                            </label>
                            {isEditing ? (
                                <Input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    type="email"
                                    className="rounded-xl"
                                />
                            ) : (
                                <p className="text-base font-semibold px-3 py-2 bg-muted/30 rounded-xl">
                                    {user.email}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                    <div className="flex gap-3 pt-4 border-t">
                        <Button
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="flex-1 gap-2"
                        >
                            {saving ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            Save Changes
                        </Button>
                        <Button
                            onClick={handleCancel}
                            variant="outline"
                            className="gap-2"
                        >
                            <X size={16} />
                            Cancel
                        </Button>
                    </div>
                )}
            </Card>

            {/* App Info */}
            <div className="pt-4 text-center">
                <p className="text-[10px] text-muted-foreground opacity-30">
                    CAMPNAV v1.2.0 • Build 240103
                </p>
            </div>
        </div>
    )
}
