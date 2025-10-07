"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Calendar, CreditCard, Loader2, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

interface PaymentRecord {
    id: string
    orderId: string
    paymentId: string
    amount: number
    currency: string
    status: string
    createdAt: any
    userEmail: string
    planId?: string
    listingId?: string
}

interface PaymentReceiptsProps {
    userEmail: string
}

export function PaymentReceipts({ userEmail }: PaymentReceiptsProps) {
    const [payments, setPayments] = useState<PaymentRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [downloadingId, setDownloadingId] = useState<string | null>(null)

    useEffect(() => {
        async function fetchPayments() {
            try {
                setLoading(true)
                const response = await fetch(`/api/payments?userEmail=${encodeURIComponent(userEmail)}`)

                if (!response.ok) {
                    throw new Error("Failed to fetch payments")
                }

                const data = await response.json()
                setPayments(data.payments || [])
            } catch (err) {
                console.error("[PaymentReceipts] Error:", err)
                setError(err instanceof Error ? err.message : "Failed to load receipts")
            } finally {
                setLoading(false)
            }
        }

        if (userEmail) {
            fetchPayments()
        }
    }, [userEmail])

    const handleDownloadReceipt = async (payment: PaymentRecord) => {
        try {
            setDownloadingId(payment.id)

            // Call Razorpay API to fetch invoice
            const response = await fetch(`/api/razorpay/invoice?paymentId=${payment.paymentId}`)

            if (!response.ok) {
                throw new Error("Failed to fetch invoice")
            }

            const invoiceData = await response.json()

            // If invoice has PDF URL, download it
            if (invoiceData.short_url) {
                window.open(invoiceData.short_url, '_blank')
                toast.success("Receipt opened in new tab")
            } else {
                toast.info("Receipt not available for this payment")
            }
        } catch (err) {
            console.error("[PaymentReceipts] Download error:", err)
            toast.error("Failed to download receipt")
        } finally {
            setDownloadingId(null)
        }
    }

    if (loading) {
        return (
            <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-gray-600" />
                        <CardTitle className="text-lg">Payment Receipts</CardTitle>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Download invoices for your transactions</p>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-gray-600" />
                        <CardTitle className="text-lg">Payment Receipts</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-600">{error}</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-gray-200 shadow-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-gray-600" />
                            <CardTitle className="text-lg">Payment Receipts</CardTitle>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Download invoices for your transactions</p>
                    </div>
                    {payments.length > 0 && (
                        <Badge variant="secondary">{payments.length} receipt{payments.length !== 1 ? 's' : ''}</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {payments.length === 0 ? (
                    <div className="text-center py-12">
                        <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-600">No receipts yet</p>
                        <p className="text-xs text-gray-500 mt-1">Your payment receipts will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {payments.map((payment) => {
                            const paymentDate = payment.createdAt?.toDate
                                ? payment.createdAt.toDate()
                                : payment.createdAt?.seconds
                                    ? new Date(payment.createdAt.seconds * 1000)
                                    : new Date(payment.createdAt)

                            return (
                                <div
                                    key={payment.id}
                                    className="p-4 border border-gray-200 rounded-lg hover:border-red-200 transition-colors space-y-3"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-red-50 rounded-lg flex-shrink-0">
                                            <FileText className="h-5 w-5 text-red-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-medium text-sm text-gray-900">
                                                    Payment Receipt
                                                </p>
                                                <Badge
                                                    variant={payment.status === "paid" ? "default" : "secondary"}
                                                    className={payment.status === "paid" ? "bg-green-600 text-xs" : "text-xs"}
                                                >
                                                    {payment.status}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-col gap-1 text-xs text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{format(paymentDate, "PPP")}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <CreditCard className="h-3 w-3" />
                                                    <span className="font-mono truncate">Order: {payment.orderId}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 ">
                                        <div>
                                            <p className="text-lg font-bold text-gray-900">
                                                ₹{payment.amount}
                                            </p>
                                            <p className="text-xs text-gray-500">{payment.currency?.toUpperCase()}</p>
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            onClick={() => handleDownloadReceipt(payment)}
                                            disabled={downloadingId === payment.id}
                                            className="h-9 w-9 sm:w-auto sm:px-4 sm:gap-2"
                                            title="Download receipt"
                                        >
                                            {downloadingId === payment.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Download className="h-4 w-4" />
                                                    <span className="hidden sm:inline">Download</span>
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
