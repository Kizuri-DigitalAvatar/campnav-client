import { CloudSun } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function WeatherWidget() {
    return (
        <Card className="bg-primary text-primary-foreground border-none shadow-md overflow-hidden relative">
            <CardContent className="p-6 flex justify-between items-center relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium opacity-90">Freetown</span>
                    </div>
                    <div className="text-4xl font-bold">
                        28°C
                    </div>
                    <div className="text-sm mt-1 opacity-90">
                        Partly sunny throughout the day
                    </div>
                </div>
                <CloudSun className="w-12 h-12 text-yellow-300" />
            </CardContent>
            {/* Background decoration circles similar to design */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
        </Card>
    )
}
