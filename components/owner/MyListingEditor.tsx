"use client"
import * as React from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function MyListingEditor({ listing }: { listing: any }) {
  const [name, setName] = React.useState<string>(listing?.name || listing?.listingName || "")
  const [address, setAddress] = React.useState<string>(listing?.address?.line1 || listing?.address || "")
  const [phone, setPhone] = React.useState<string>(listing?.phone || "")
  const [description, setDescription] = React.useState<string>(listing?.description || "")
  const [hours, setHours] = React.useState<string>(typeof listing?.hours === "string" ? listing?.hours : "")
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [ok, setOk] = React.useState(false)

  async function onSave() {
    setSaving(true); setError(null); setOk(false)
    try {
      const payload: any = { name, address: address ? { line1: address } : null, phone, description, hours }
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error ? String(json.error) : "Failed to save")
      setOk(true)
    } catch (e: any) {
      setError(e?.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Business Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Business Description</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="hours">Business Hours (free text)</Label>
        <Textarea id="hours" value={hours} onChange={(e) => setHours(e.target.value)} rows={3} placeholder="e.g., Mon-Sat 9am–7pm; Sun closed" />
      </div>
      <div className="flex items-center gap-3 pt-1">
        <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        {ok && <span className="text-sm text-green-600">Saved</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  )
}

