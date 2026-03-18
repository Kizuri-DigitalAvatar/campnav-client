"use client"

import { useState, useRef } from "react"
import { Camera, Mic, X, Upload, Image as ImageIcon } from "lucide-react"
import { useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"

interface MultimediaUploadProps {
    assignmentId: string
    onComplete: () => void
    onCancel: () => void
}

export function MultimediaUpload({
    assignmentId,
    onComplete,
    onCancel,
}: MultimediaUploadProps) {
    const [text, setText] = useState("")
    const [images, setImages] = useState<File[]>([])
    const [isRecording, setIsRecording] = useState(false)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])

    const generateUploadUrl = useMutation(api.files.generateUploadUrl)
    const addUpdate = useMutation(api.tasks.addUpdate)

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setImages(Array.from(e.target.files))
        }
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data)
            }

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
                setAudioBlob(audioBlob)
                stream.getTracks().forEach((track) => track.stop())
            }

            mediaRecorder.start()
            setIsRecording(true)
        } catch (error) {
            console.error("Error starting recording:", error)
            alert("Could not access microphone")
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
        }
    }

    const handleSubmit = async () => {
        if (isSubmitting) return

        setIsSubmitting(true)

        try {
            const imageStorageIds: string[] = []
            let audioStorageId: string | undefined

            // Upload images
            for (const image of images) {
                const uploadUrl = await generateUploadUrl()
                const result = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": image.type },
                    body: image,
                })
                const { storageId } = await result.json()
                imageStorageIds.push(storageId)
            }

            // Upload audio
            if (audioBlob) {
                const uploadUrl = await generateUploadUrl()
                const result = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": audioBlob.type },
                    body: audioBlob,
                })
                const { storageId } = await result.json()
                audioStorageId = storageId
            }

            // Add update to assignment
            await addUpdate({
                id: assignmentId as any,
                text: text || undefined,
                images: imageStorageIds.length > 0 ? imageStorageIds : undefined,
                audio: audioStorageId,
            })

            onComplete()
        } catch (error) {
            console.error("Error uploading update:", error)
            alert("Failed to upload update")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card border rounded-3xl p-6 max-w-lg w-full space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Add Update</h2>
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="p-2 hover:bg-muted rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                            Notes
                        </label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            disabled={isSubmitting}
                            placeholder="Add notes about your progress..."
                            className="w-full h-24 rounded-xl border bg-muted/50 px-4 py-3 text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                            Photos
                        </label>
                        <label className="flex items-center justify-center gap-2 h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageSelect}
                                disabled={isSubmitting}
                                className="hidden"
                            />
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                {images.length > 0
                                    ? `${images.length} image(s) selected`
                                    : "Click to upload images"}
                            </span>
                        </label>
                    </div>

                    <div>
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                            Voice Note
                        </label>
                        <div className="flex gap-2">
                            {!isRecording && !audioBlob && (
                                <button
                                    onClick={startRecording}
                                    disabled={isSubmitting}
                                    className="flex-1 flex items-center justify-center gap-2 h-12 bg-muted border rounded-xl hover:bg-muted/80 transition-colors"
                                >
                                    <Mic className="w-5 h-5" />
                                    <span className="text-sm font-bold">Start Recording</span>
                                </button>
                            )}
                            {isRecording && (
                                <button
                                    onClick={stopRecording}
                                    disabled={isSubmitting}
                                    className="flex-1 flex items-center justify-center gap-2 h-12 bg-destructive text-destructive-foreground rounded-xl animate-pulse"
                                >
                                    <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                                    <span className="text-sm font-bold">Recording... (Tap to stop)</span>
                                </button>
                            )}
                            {audioBlob && !isRecording && (
                                <div className="flex-1 flex items-center justify-between gap-2 h-12 bg-primary/10 border border-primary/20 rounded-xl px-4">
                                    <div className="flex items-center gap-2">
                                        <Mic className="w-5 h-5 text-primary" />
                                        <span className="text-sm font-bold">Audio recorded</span>
                                    </div>
                                    <button
                                        onClick={() => setAudioBlob(null)}
                                        disabled={isSubmitting}
                                        className="p-1 hover:bg-destructive/10 rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4 text-destructive" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex-1 h-11 px-6 rounded-xl border bg-muted text-foreground font-black text-xs uppercase tracking-widest hover:bg-muted/80 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || (!text && images.length === 0 && !audioBlob)}
                        className="flex-1 h-11 px-6 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <span className="inline-flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Submitting...</span>
                            </span>
                        ) : (
                            "Submit Update"
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
