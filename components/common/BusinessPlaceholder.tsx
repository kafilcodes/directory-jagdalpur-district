import { Building2 } from "lucide-react"

interface BusinessPlaceholderProps {
    className?: string
}

export function BusinessPlaceholder({ className = "w-full h-full" }: BusinessPlaceholderProps) {
    return (
        <div className={`${className} bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center`}>
            <Building2 className="w-8 h-8 text-gray-400" />
        </div>
    )
}
