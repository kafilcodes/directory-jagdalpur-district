import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

export default function PoliciesPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ChevronLeft className="h-5 w-5" />
                            <span className="text-sm font-medium">Back</span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold">
                                D
                            </div>
                            <h1 className="text-xl font-bold text-gray-900">Terms & Policies</h1>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg border shadow-sm p-6">
                    <Accordion type="single" collapsible className="space-y-4">
                        {/* Terms and Conditions */}
                        <AccordionItem value="terms" className="border rounded-lg px-4">
                            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                                Terms and Conditions
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-700 space-y-4 pt-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">1. Platform Usage</h3>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>This platform is exclusively for business listings in Dhamtari District</li>
                                        <li>Users must provide accurate and up-to-date business information</li>
                                        <li>Only authorized business owners or representatives may create listings</li>
                                        <li>Each business is limited to one listing per account</li>
                                        <li>False, misleading, or duplicate listings will be removed without notice</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">2. User Responsibility</h3>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>Users are solely responsible for the content they submit</li>
                                        <li>Any unethical behavior, spam, or misuse will result in account termination</li>
                                        <li>Users must not engage in fraudulent activities or misrepresentation</li>
                                        <li>Business owners are responsible for updating their listing information</li>
                                        <li>Users must comply with all local laws and regulations</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">3. Listing Guidelines</h3>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>Listings must contain accurate business details including name, address, and contact information</li>
                                        <li>Business must have a verified Google Business Profile</li>
                                        <li>Inappropriate, offensive, or illegal content is strictly prohibited</li>
                                        <li>The platform reserves the right to reject or remove any listing at its discretion</li>
                                        <li>Listings must represent legitimate, operating businesses</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">4. Prohibited Activities</h3>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>Creating fake or fraudulent business listings</li>
                                        <li>Impersonating another business or individual</li>
                                        <li>Attempting to manipulate search rankings or visibility</li>
                                        <li>Posting spam, advertisements, or irrelevant content</li>
                                        <li>Violating intellectual property rights</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">5. Service Modifications</h3>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>We reserve the right to modify, suspend, or discontinue any service at any time</li>
                                        <li>Platform features and pricing may change with notice</li>
                                        <li>Terms and conditions may be updated periodically</li>
                                        <li>Continued use after changes constitutes acceptance of new terms</li>
                                    </ul>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        {/* Privacy Policy */}
                        <AccordionItem value="privacy" className="border rounded-lg px-4">
                            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                                Privacy Policy
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-700 space-y-4 pt-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">1. Data Collection</h3>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>We collect business information including name, address, contact details, and category</li>
                                        <li>User account data such as email address and authentication details</li>
                                        <li>Payment information for paid plan subscriptions (processed securely via Razorpay)</li>
                                        <li>Business photos and media from Google Business Profile</li>
                                        <li>Usage data and analytics to improve our services</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">2. Data Usage</h3>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>To display business listings to users searching the directory</li>
                                        <li>To process payments and manage subscriptions</li>
                                        <li>To communicate important updates about your listing or account</li>
                                        <li>To improve platform functionality and user experience</li>
                                        <li>To ensure compliance with terms and prevent misuse</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">3. Data Protection</h3>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>We use industry-standard security measures to protect your data</li>
                                        <li>User passwords are encrypted and never stored in plain text</li>
                                        <li>Payment processing is handled securely by Razorpay</li>
                                        <li>Access to personal data is restricted to authorized personnel only</li>
                                        <li>We do not sell or share your personal information with third parties for marketing purposes</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">4. Public Information</h3>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>Business listings and associated information are publicly visible on the platform</li>
                                        <li>Contact details, addresses, and business descriptions are displayed to users</li>
                                        <li>Photos from Google Business Profile are shown publicly</li>
                                        <li>Users can search and view all active listings</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">5. User Rights</h3>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>You can update or edit your business listing at any time</li>
                                        <li>You may request deletion of your account and associated data</li>
                                        <li>You can contact us to access your personal information</li>
                                        <li>You have the right to opt out of promotional communications</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">6. Cookies and Tracking</h3>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>We use cookies to maintain user sessions and preferences</li>
                                        <li>Analytics tools help us understand platform usage patterns</li>
                                        <li>You can disable cookies in your browser settings (may affect functionality)</li>
                                    </ul>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        {/* Payment Terms */}
                        <AccordionItem value="payment" className="border rounded-lg px-4">
                            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                                Payment Terms
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-700 space-y-4 pt-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">1. Pricing Plans</h3>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li><strong>Free Plan:</strong> Basic listing with standard visibility</li>
                                        <li><strong>Sponsored Plan:</strong> Enhanced visibility with priority placement</li>
                                        <li><strong>Featured Plan:</strong> Maximum visibility with top placement and highlighted display</li>
                                        <li>Plan prices and features are subject to change with prior notice</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">2. Payment Processing</h3>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>All payments are processed securely through Razorpay</li>
                                        <li>Payment must be completed before listing activation for paid plans</li>
                                        <li>We do not store credit card or bank account details</li>
                                        <li>Payment confirmation is sent via email</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">3. Plan Duration and Renewal</h3>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>Paid plans have a specified validity period (30, 90, or 365 days)</li>
                                        <li>Plan benefits remain active until the expiry date</li>
                                        <li>Plans do not auto-renew; manual renewal is required</li>
                                        <li>You will receive notifications before plan expiry</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">4. Refund Policy</h3>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>Refunds are handled on a case-by-case basis</li>
                                        <li>Contact support within 7 days of payment for refund requests</li>
                                        <li>No refunds for partially used subscription periods</li>
                                        <li>Refunds may take 7-10 business days to process</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">5. Failed Payments</h3>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>Failed payments will not activate paid plan benefits</li>
                                        <li>Draft data is saved for recovery after successful payment</li>
                                        <li>Contact support if you experience payment issues</li>
                                    </ul>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        {/* FAQs */}
                        <AccordionItem value="faq" className="border rounded-lg px-4">
                            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                                Frequently Asked Questions
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-700 space-y-4 pt-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Q: How do I create a business listing?</h3>
                                    <p>Sign in to your account, navigate to "Create Listing," enter your Google Business Profile URL, verify the details, choose a plan, and complete the payment (if applicable). Your listing will be live after submission.</p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Q: Do I need a Google Business Profile?</h3>
                                    <p>Yes, a verified Google Business Profile is mandatory. This ensures accurate business information and helps maintain listing quality.</p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Q: Can I edit my listing after publishing?</h3>
                                    <p>Yes, you can edit your listing anytime from the "My Listing" section in your dashboard.</p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Q: How long does it take for my listing to appear?</h3>
                                    <p>Listings appear instantly after successful submission. For paid plans, activation happens immediately after payment confirmation.</p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Q: Can I have multiple listings?</h3>
                                    <p>No, each user account is limited to one business listing. If you have multiple businesses, you'll need separate accounts.</p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Q: What's the difference between plans?</h3>
                                    <p>Free plans provide basic visibility. Sponsored plans offer enhanced visibility with priority placement. Featured plans provide maximum visibility with top placement and highlighted display.</p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Q: How do I upgrade my plan?</h3>
                                    <p>Contact support to upgrade your existing listing to a higher plan. Upgrade pricing will be prorated based on remaining validity.</p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Q: What happens when my paid plan expires?</h3>
                                    <p>Your listing will revert to the free plan with standard visibility. You can renew anytime to restore paid plan benefits.</p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Q: How can I delete my listing?</h3>
                                    <p>Contact support to request listing deletion. Note that paid plan subscriptions are non-refundable.</p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Q: Is my payment information secure?</h3>
                                    <p>Yes, all payments are processed through Razorpay's secure gateway. We do not store any payment card details on our servers.</p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Q: Who can I contact for support?</h3>
                                    <p>For any issues or questions, please reach out through the contact form on our website or email our support team.</p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>

                {/* Footer Note */}
                <div className="mt-8 text-center text-sm text-gray-600">
                    <p>Last updated: January 2025</p>
                    <p className="mt-2">
                        For questions or concerns, please contact our support team.
                    </p>
                </div>
            </main>
        </div>
    )
}
