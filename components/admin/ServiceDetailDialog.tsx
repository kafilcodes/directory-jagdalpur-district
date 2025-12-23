"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    User,
    Phone,
    Mail,
    MapPin,
    Clock,
    IndianRupee,
    Star,
    Briefcase,
    Calendar,
    CheckCircle,
    XCircle,
    MessageCircle,
    BadgeCheck,
    Globe,
    Loader2,
    CircleCheck,
    CircleDot,
    CircleX,
    Copy
} from "lucide-react"
import { getServiceCategoryBySlug, SERVICE_QUALITY_LEVELS, SERVICE_EXPERIENCE_LEVELS } from "@/config/services"
import { toast } from "sonner"
import type { Service } from "@/types"

const CITY_NAME = process.env.NEXT_PUBLIC_CITY_NAME || "Dhamtari"

interface ServiceDetailDialogProps {
    service: Service | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onStatusUpdate?: (serviceId: string, status: 'pending' | 'live' | 'rejected') => void
    isUpdating?: boolean
}

export default function ServiceDetailDialog({
    service,
    open,
    onOpenChange,
    onStatusUpdate,
    isUpdating
}: ServiceDetailDialogProps) {
    if (!service) return null

    const category = getServiceCategoryBySlug(service.serviceSlug || service.service)
    const serviceIcon = category?.icon || "🔧"
    const serviceLabel = category?.label || service.service || "Service"
    const serviceBgColor = category?.color || "bg-gray-100"

    // Get quality level info
    const qualityInfo = service.qualityRating
        ? SERVICE_QUALITY_LEVELS.find((q) => q.value === Math.round(service.qualityRating))
        : null

    // Get experience level info
    const experienceInfo = service.experienceYears
        ? SERVICE_EXPERIENCE_LEVELS.find((e) => {
            const years = service.experienceYears
            if (years === undefined) return false
            if (e.min <= years && years < e.max) return true
            if (e.max === 100 && years >= e.min) return true
            return false
        })
        : null

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'live':
                return {
                    icon: CircleCheck,
                    label: "Live",
                    color: "text-emerald-600",
                    bgColor: "bg-emerald-50",
                    borderColor: "border-emerald-200"
                }
            case 'pending':
                return {
                    icon: CircleDot,
                    label: "Pending Review",
                    color: "text-amber-600",
                    bgColor: "bg-amber-50",
                    borderColor: "border-amber-200"
                }
            case 'rejected':
                return {
                    icon: CircleX,
                    label: "Rejected",
                    color: "text-red-600",
                    bgColor: "bg-red-50",
                    borderColor: "border-red-200"
                }
            default:
                return {
                    icon: CircleDot,
                    label: status,
                    color: "text-gray-600",
                    bgColor: "bg-gray-50",
                    borderColor: "border-gray-200"
                }
        }
    }

    const statusInfo = getStatusInfo(service.status)
    const StatusIcon = statusInfo.icon

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                    />
                ))}
            </div>
        )
    }

    // Format date
    const formatDate = (timestamp: any) => {
        if (!timestamp) return "N/A"
        const date = timestamp.seconds
            ? new Date(timestamp.seconds * 1000)
            : new Date(timestamp)
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        })
    }

    // Handle phone call
    const handleCall = () => {
        if (service?.contactNumber) {
            window.open(`tel:+91${service.contactNumber}`, "_self")
        }
    }

    // Handle WhatsApp
    const handleWhatsApp = () => {
        if (service?.whatsappNumber || service?.contactNumber) {
            const number = service.whatsappNumber || service.contactNumber
            const message = encodeURIComponent(
                `Hi ${service.name}, I'm reaching out from ${CITY_NAME} Directory admin panel regarding your service listing.`
            )
            window.open(`https://wa.me/91${number}?text=${message}`, "_blank")
        }
    }

    // Copy to clipboard
    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`${label} copied!`)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl max-h-[90vh] p-0 overflow-hidden bg-white shadow-2xl border-0 rounded-xl">
                <TooltipProvider>
                    <ScrollArea className="max-h-[90vh]">
                        {/* Header Section */}
                        <div className="relative bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 p-5 border-b">
                            <DialogHeader>
                                <div className="flex gap-4">
                                    {/* Profile Photo */}
                                    <Avatar className="h-16 w-16 border-2 border-white shadow-md ring-2 ring-gray-100 shrink-0">
                                        {service.profilePhoto ? (
                                            <AvatarImage src={service.profilePhoto} alt={service.name} />
                                        ) : (
                                            <AvatarFallback className="bg-gray-100 text-gray-400">
                                                <User className="h-6 w-6" />
                                            </AvatarFallback>
                                        )}
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        {/* Name & Status */}
                                        <div className="flex items-start justify-between gap-2">
                                            <DialogTitle className="text-lg font-semibold text-gray-900 leading-tight">
                                                {service.name}
                                            </DialogTitle>
                                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color} border ${statusInfo.borderColor}`}>
                                                <StatusIcon className="h-3 w-3" />
                                                <span>{statusInfo.label}</span>
                                            </div>
                                        </div>

                                        {/* Service Type */}
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs mt-1.5 ${serviceBgColor} text-gray-700`}>
                                            <span>{serviceIcon}</span>
                                            <span className="font-medium">{serviceLabel}</span>
                                        </div>

                                        {/* Rating Row */}
                                        <div className="flex items-center gap-2 mt-2">
                                            {renderStars(service.qualityRating)}
                                            <span className="text-sm font-semibold text-gray-800">
                                                {service.qualityRating.toFixed(1)}
                                            </span>
                                            {qualityInfo && (
                                                <span className="text-xs text-gray-500">
                                                    • {qualityInfo.label}
                                                </span>
                                            )}
                                            {service.aadharNumber && (
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <BadgeCheck className="h-4 w-4 text-emerald-500" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>ID Verified</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </DialogHeader>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Quick Actions - Call & WhatsApp */}
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    onClick={handleCall}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                >
                                    <Phone className="h-4 w-4 mr-2" />
                                    Call Now
                                </Button>
                                <Button
                                    onClick={handleWhatsApp}
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                >
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    WhatsApp
                                </Button>
                            </div>

                            {/* Pricing Card */}
                            <Card className="border border-emerald-100 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 shadow-sm">
                                <CardContent className="p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <IndianRupee className="h-4 w-4" />
                                            <span className="text-sm font-medium">Rate / Hour</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl font-bold text-emerald-700">
                                                ₹{service.chargesPerHour}
                                            </span>
                                            {service.isNegotiable && (
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Price is negotiable</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Info Sections */}
                            <div className="space-y-3">
                                {/* Contact Section */}
                                <div className="rounded-lg border border-gray-100 overflow-hidden">
                                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                                            <Phone className="h-3.5 w-3.5" />
                                            Contact Information
                                        </h4>
                                    </div>
                                    <div className="p-3 space-y-2 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500">Phone</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900">+91 {service.contactNumber}</span>
                                                <button
                                                    onClick={() => copyToClipboard(service.contactNumber, "Phone number")}
                                                    className="text-gray-400 hover:text-gray-600"
                                                >
                                                    <Copy className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        {service.whatsappNumber && service.whatsappNumber !== service.contactNumber && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-500">WhatsApp</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900">+91 {service.whatsappNumber}</span>
                                                    <button
                                                        onClick={() => copyToClipboard(service.whatsappNumber, "WhatsApp number")}
                                                        className="text-gray-400 hover:text-gray-600"
                                                    >
                                                        <Copy className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {service.email && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-500">Email</span>
                                                <a href={`mailto:${service.email}`} className="font-medium text-blue-600 hover:underline truncate max-w-[200px]">
                                                    {service.email}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Location Section */}
                                <div className="rounded-lg border border-gray-100 overflow-hidden">
                                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5" />
                                            Location
                                        </h4>
                                    </div>
                                    <div className="p-3 space-y-1 text-sm">
                                        <p className="font-medium text-gray-900">{service.address}</p>
                                        {service.blockOfCity && (
                                            <p className="text-gray-500">Area: {service.blockOfCity}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Working Hours */}
                                    {service.workingHours && (
                                        <div className="rounded-lg border border-gray-100 p-3">
                                            <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span className="text-xs font-medium uppercase">Hours</span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-900">{service.workingHours}</p>
                                        </div>
                                    )}

                                    {/* Experience */}
                                    {service.experienceYears !== undefined && (
                                        <div className="rounded-lg border border-gray-100 p-3">
                                            <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                                                <Briefcase className="h-3.5 w-3.5" />
                                                <span className="text-xs font-medium uppercase">Experience</span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {service.experienceYears} years
                                                {experienceInfo && (
                                                    <span className="text-gray-500 ml-1 text-xs">({experienceInfo.label})</span>
                                                )}
                                            </p>
                                        </div>
                                    )}

                                    {/* Personal Info */}
                                    {(service.age || service.gender) && (
                                        <div className="rounded-lg border border-gray-100 p-3">
                                            <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                                                <User className="h-3.5 w-3.5" />
                                                <span className="text-xs font-medium uppercase">Personal</span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-900 capitalize">
                                                {service.gender}
                                                {service.gender && service.age && ", "}
                                                {service.age && `${service.age} yrs`}
                                            </p>
                                        </div>
                                    )}

                                    {/* Submitted Date */}
                                    <div className="rounded-lg border border-gray-100 p-3">
                                        <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span className="text-xs font-medium uppercase">Submitted</span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-900">{formatDate(service.createdAt)}</p>
                                    </div>
                                </div>

                                {/* Tags/Skills */}
                                {service.tags && service.tags.length > 0 && (
                                    <div className="rounded-lg border border-gray-100 overflow-hidden">
                                        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                Skills & Services
                                            </h4>
                                        </div>
                                        <div className="p-3 flex flex-wrap gap-1.5">
                                            {service.tags.map((tag: string, idx: number) => (
                                                <Badge key={idx} variant="secondary" className="text-xs font-normal bg-gray-100 hover:bg-gray-200 text-gray-700">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Admin Actions */}
                            {onStatusUpdate && (
                                <>
                                    <Separator className="my-2" />
                                    <div className="space-y-2">
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quick Actions</p>
                                        <div className="flex flex-wrap gap-2">
                                            {service.status !== 'live' && (
                                                <Button
                                                    onClick={() => onStatusUpdate(service.id, 'live')}
                                                    disabled={isUpdating}
                                                    size="sm"
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                                >
                                                    {isUpdating ? (
                                                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                                    )}
                                                    Approve (Live)
                                                </Button>
                                            )}
                                            {service.status !== 'pending' && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => onStatusUpdate(service.id, 'pending')}
                                                    disabled={isUpdating}
                                                    size="sm"
                                                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                                                >
                                                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                                                    Set Pending
                                                </Button>
                                            )}
                                            {service.status !== 'rejected' && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => onStatusUpdate(service.id, 'rejected')}
                                                    disabled={isUpdating}
                                                    size="sm"
                                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                                >
                                                    <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                                    Reject
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </ScrollArea>
                </TooltipProvider>
            </DialogContent>
        </Dialog>
    )
}
