"use client"; // This MUST be the very first line

export function WhatsAppButton({phoneNumber, message}: {phoneNumber: string; message?: string}) {
  
  const handleWhatsAppClick = () => {
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message || 'Hey there i have some Query about Directory')}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div>
      {/* ... other page content ... */}
      <button onClick={handleWhatsAppClick} className="text-base font-medium text-gray-600 hover:text-red-700 transition-colors">
        Chat on WhatsApp
      </button>
    </div>
  );
}

