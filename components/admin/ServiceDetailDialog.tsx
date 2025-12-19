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
    Loader2
} from "lucide-react"
import { getServiceCategoryBySlug, SERVICE_QUALITY_LEVELS, SERVICE_EXPERIENCE_LEVELS } from "@/config/services"
import type { Service } from "@/types"

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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'live':
                return <Badge className="bg-emerald-500/90 text-white shadow-sm">Live</Badge>
            case 'pending':
                return <Badge className="bg-yellow-500/90 text-white shadow-sm">Pending</Badge>
            case 'rejected':
                return <Badge className="bg-red-500/90 text-white shadow-sm">Rejected</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden bg-white/95 backdrop-blur shadow-2xl border-0">
                <ScrollArea className="max-h-[90vh]">
                    {/* Header with gradient */}
                    <div className="relative bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-6 pb-4">
                        <DialogHeader>
                            <div className="flex items-start gap-4">
                                {/* Profile Photo */}
                                <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                                    {service.profilePhoto ? (
                                        <AvatarImage src={service.profilePhoto} alt={service.name} />
                                    ) : (
                                        <AvatarFallback className="bg-white text-gray-400">
                                            <User className="h-8 w-8" />
                                        </AvatarFallback>
                                    )}
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <DialogTitle className="text-xl font-bold text-gray-900">
                                            {service.name}
                                        </DialogTitle>
                                        {getStatusBadge(service.status)}
                                    </div>

                                    {/* Service Type */}
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm mt-2 ${serviceBgColor} text-gray-800`}>
                                        <span className="text-lg">{serviceIcon}</span>
                                        <span className="font-medium">{serviceLabel}</span>
                                    </div>

                                    {/* Rating */}
                                    <div className="flex items-center gap-2 mt-2">
                                        {renderStars(service.qualityRating)}
                                        <span className="font-semibold text-gray-900">
                                            {service.qualityRating.toFixed(1)}
                                        </span>
                                        {qualityInfo && (
                                            <Badge variant="secondary" className="text-xs">
                                                {qualityInfo.label}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Verified badge */}
                                    {service.aadharNumber && (
                                        <div className="flex items-center gap-1 mt-1 text-emerald-600">
                                            <BadgeCheck className="h-4 w-4" />
                                            <span className="text-sm font-medium">ID Verified</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </DialogHeader>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Charges Section */}
                        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl shadow-sm">
                            <div className="flex items-center gap-2">
                                <IndianRupee className="h-5 w-5 text-emerald-600" />
                                <span className="text-gray-700 font-medium">Charges per Hour</span>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-emerald-700">
                                    ₹{service.chargesPerHour}
                                </span>
                                {service.isNegotiable && (
                                    <Badge variant="outline" className="ml-2 text-emerald-600 border-emerald-300">
                                        Negotiable
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Contact */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-red-500" />
                                    Contact Information
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <p className="flex items-center gap-2 text-gray-700">
                                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                                        +91 {service.contactNumber}
                                    </p>
                                    {service.whatsappNumber && service.whatsappNumber !== service.contactNumber && (
                                        <p className="flex items-center gap-2 text-gray-700">
                                            <MessageCircle className="h-3.5 w-3.5 text-green-500" />
                                            +91 {service.whatsappNumber} (WhatsApp)
                                        </p>
                                    )}
                                    {service.email && (
                                        <p className="flex items-center gap-2 text-gray-700">
                                            <Mail className="h-3.5 w-3.5 text-gray-400" />
                                            {service.email}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Location */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-red-500" />
                                    Location
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <p className="text-gray-700">{service.address}</p>
                                    {service.blockOfCity && (
                                        <p className="text-gray-500">Area: {service.blockOfCity}</p>
                                    )}
                                </div>
                            </div>

                            {/* Working Hours */}
                            {service.workingHours && (
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-red-500" />
                                        Working Hours
                                    </h4>
                                    <p className="text-sm text-gray-700">{service.workingHours}</p>
                                </div>
                            )}

                            {/* Experience */}
                            {service.experienceYears !== undefined && (
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <Briefcase className="h-4 w-4 text-red-500" />
                                        Experience
                                    </h4>
                                    <p className="text-sm text-gray-700">
                                        {service.experienceYears} years
                                        {experienceInfo && (
                                            <span className="text-gray-500 ml-1">({experienceInfo.label})</span>
                                        )}
                                    </p>
                                </div>
                            )}

                            {/* Personal Info */}
                            {(service.age || service.gender) && (
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <User className="h-4 w-4 text-red-500" />
                                        Personal Info
                                    </h4>
                                    <p className="text-sm text-gray-700">
                                        {service.gender && <span className="capitalize">{service.gender}</span>}
                                        {service.gender && service.age && ", "}
                                        {service.age && <span>{service.age} years old</span>}
                                    </p>
                                </div>
                            )}

                            {/* Created At */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-red-500" />
                                    Submitted On
                                </h4>
                                <p className="text-sm text-gray-700">{formatDate(service.createdAt)}</p>
                            </div>
                        </div>

                        {/* Tags */}
                        {service.tags && service.tags.length > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-3">Skills & Services</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {service.tags.map((tag: string, idx: number) => (
                                            <Badge key={idx} variant="secondary" className="text-xs shadow-sm">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Quick Actions */}
                        {onStatusUpdate && (
                            <>
                                <Separator />
                                <div className="flex flex-wrap gap-2">
                                    {service.status !== 'live' && (
                                        <Button
                                            onClick={() => onStatusUpdate(service.id, 'live')}
                                            disabled={isUpdating}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                                        >
                                            {isUpdating ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                            )}
                                            Approve (Live)
                                        </Button>
                                    )}
                                    {service.status !== 'pending' && (
                                        <Button
                                            variant="outline"
                                            onClick={() => onStatusUpdate(service.id, 'pending')}
                                            disabled={isUpdating}
                                            className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 shadow-sm"
                                        >
                                            <Clock className="h-4 w-4 mr-2" />
                                            Set Pending
                                        </Button>
                                    )}
                                    {service.status !== 'rejected' && (
                                        <Button
                                            variant="outline"
                                            onClick={() => onStatusUpdate(service.id, 'rejected')}
                                            disabled={isUpdating}
                                            className="border-red-500 text-red-600 hover:bg-red-50 shadow-sm"
                                        >
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Reject
                                        </Button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
