# Testing Guide - Google Places + Razorpay Integration

## 🚀 Quick Start Testing

### Prerequisites
1. **Dev server running**: `npm run dev`
2. **Browser**: Chrome/Firefox with DevTools
3. **Internet connection**: Required for Google Places & Razorpay
4. **Test payment cards**: Use Razorpay test cards

---

## 📋 Test Scenarios

### Scenario 1: Happy Path - Complete Flow ✅

**Steps:**
1. Navigate to http://localhost:3000/user/create-listing
2. **Step 1 - Business Info:**
   - Type "Hotel" in search box
   - Wait for suggestions to load
   - Select a business from Dhamtari
   - Verify auto-fill (name, address, phone, etc.)
   - Check Google Photos display
   - Click "Next"

3. **Step 2 - Details:**
   - Verify category is pre-selected
   - Add description (test with 50+ characters)
   - Add tags: "restaurant, food, delivery"
   - Add email (optional)
   - Click "Next"

4. **Step 3 - Media:**
   - Verify Google Photos are shown
   - Upload 2-3 photos from device
   - Try removing one photo
   - Click "Next"

5. **Step 4 - Payment:**
   - Select "Pro" plan (₹499)
   - Review listing summary
   - Click "Pay ₹499"
   - Razorpay modal should open
   - **Use test card**: 
     - Card: 4111 1111 1111 1111
     - CVV: 123
     - Expiry: Any future date
   - Click "Pay"
   - Wait for progress bar (0% → 100%)
   - Should redirect to "My Listing" page

**Expected Results:**
- ✅ All steps complete without errors
- ✅ Payment successful
- ✅ Listing created in Firestore
- ✅ Photos uploaded
- ✅ Draft cleared

---

### Scenario 2: Location Restriction Test ❌

**Purpose:** Verify Dhamtari-only restriction

**Steps:**
1. Go to Create Listing page
2. Search for "Delhi restaurant" or "Mumbai hotel"
3. Select a business from outside Dhamtari
4. **Expected:** Red error banner appears
5. **Message:** "This business is outside Dhamtari district. Only businesses located in Dhamtari are allowed."
6. Search box should clear
7. User cannot proceed

**Expected Results:**
- ❌ Location restriction prevents selection
- ✅ Clear error message shown
- ✅ Form resets to allow new search

---

### Scenario 3: Draft Auto-Save & Recovery 💾

**Purpose:** Verify draft persistence

**Steps:**
1. Go to Create Listing page
2. Fill Step 1: Enter business name manually (don't use Google)
3. Fill address, phone
4. **Wait 3 seconds** (auto-save triggers)
5. **Refresh the page** (Ctrl+R / Cmd+R)
6. **Expected:** Blue banner appears at top
7. **Message:** "You have an unsaved draft from Just now"
8. Click "Load Draft"
9. Verify form is restored with previous data
10. Try "Discard" button → draft should be cleared

**Expected Results:**
- ✅ Draft saves automatically
- ✅ Banner shows on reload
- ✅ Load restores all data
- ✅ Discard clears draft

---

### Scenario 4: Form Validation ⚠️

**Purpose:** Test step validation

**Test 4.1: Step 1 Validation**
1. Go to Create Listing
2. Leave business name empty
3. Click "Next"
4. **Expected:** Red error: "Business name is required"

**Test 4.2: Step 2 Validation**
1. Complete Step 1
2. On Step 2, leave category empty
3. Click "Next"
4. **Expected:** Error: "Category is required"

**Test 4.3: Step 3 Validation**
1. Complete Steps 1-2
2. On Step 3, don't upload any photos
3. (Assume no Google Photos available)
4. Click "Next"
5. **Expected:** Error: "Please upload at least one photo"

**Expected Results:**
- ✅ All validation errors appear
- ✅ User cannot proceed without required fields
- ✅ Error messages are clear

---

### Scenario 5: Photo Upload Limits 📸

**Purpose:** Test plan-based photo limits

**Test 5.1: Basic Plan (5 photos)**
1. Complete Steps 1-2
2. On Step 4, select "Basic" plan
3. Go back to Step 3
4. Try uploading 6+ photos
5. **Expected:** Error: "Maximum 5 photos allowed for basic plan"

**Test 5.2: Pro Plan (10 photos)**
1. On Step 4, select "Pro" plan
2. Go back to Step 3
3. Upload 10 photos
4. Try adding 11th photo
5. **Expected:** Error: "Maximum 10 photos allowed for pro plan"

**Expected Results:**
- ✅ Limits enforced based on plan
- ✅ Clear error messages
- ✅ "Choose Photos" button disabled at limit

---

### Scenario 6: Payment Cancellation 🚫

**Purpose:** Test payment failure handling

**Steps:**
1. Complete all 3 steps
2. On Step 4, select any plan
3. Click "Pay"
4. Razorpay modal opens
5. **Click "X" to close modal** (cancel payment)
6. **Expected:** Error message appears
7. **Message:** "Payment cancelled"
8. User can retry payment

**Expected Results:**
- ✅ Error message shown
- ✅ Form remains intact
- ✅ User can click "Pay" again

---

### Scenario 7: Manual Entry Fallback ✍️

**Purpose:** Test when business not found on Google

**Steps:**
1. Go to Create Listing
2. Don't use Google search
3. Scroll down to "Or enter manually"
4. Fill manually:
   - Business Name: "Test Cafe"
   - Address: "Main Road, Dhamtari, CG"
   - Phone: "+91 9876543210"
   - Website: "https://testcafe.com"
5. Continue through all steps
6. Complete payment

**Expected Results:**
- ✅ Manual entry works
- ✅ No Google Place data required
- ✅ Listing created successfully

---

## 🧪 API Testing (Postman/cURL)

### Test 1: Autocomplete API

```bash
curl -X POST http://localhost:3000/api/google-places/autocomplete \
  -H "Content-Type: application/json" \
  -d '{"input": "restaurant"}'
```

**Expected Response:**
```json
{
  "success": true,
  "suggestions": [
    {
      "placeId": "ChIJ...",
      "mainText": "Restaurant Name",
      "secondaryText": "Address, Dhamtari",
      "types": ["restaurant", "food"]
    }
  ]
}
```

---

### Test 2: Place Details API

```bash
curl -X POST http://localhost:3000/api/google-places/details \
  -H "Content-Type: application/json" \
  -d '{"placeId": "YOUR_PLACE_ID"}'
```

**Expected Response:**
```json
{
  "success": true,
  "placeDetails": {
    "name": "Business Name",
    "address": "Full Address",
    "phone": "+91...",
    "location": { "lat": 21.44, "lng": 81.59 },
    "photos": [...],
    "rating": 4.5
  }
}
```

---

### Test 3: Create Order API

```bash
curl -X POST http://localhost:3000/api/razorpay/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 499,
    "planType": "pro",
    "listingTitle": "Test Business"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "order": {
    "id": "order_...",
    "amount": 49900,
    "currency": "INR",
    "status": "created"
  }
}
```

---

## 🔍 DevTools Checks

### Console Logs to Watch:
1. **Auto-save:** `"Draft saved successfully"`
2. **Place selected:** `"Business details loaded successfully!"`
3. **Order created:** `"Razorpay order created: { orderId, amount, planType }"`
4. **Payment verified:** `"Payment verified successfully"`
5. **Upload progress:** Check upload percentage in UI

### Network Tab:
- Check API calls: `/api/google-places/*`, `/api/razorpay/*`
- Verify status codes: All should be 200
- Check payloads and responses

### LocalStorage:
- Key: `listing_draft`
- Key: `listing_draft_timestamp`
- Verify draft data structure

---

## 📊 Database Verification (Firestore)

After successful listing creation, check:

1. **Collection:** `listings`
2. **Document ID:** Auto-generated
3. **Fields to verify:**
   - `name` ✅
   - `category` ✅
   - `address` ✅
   - `photos` (array) ✅
   - `plan` ('basic'/'pro'/'premium') ✅
   - `orderId` ✅
   - `paymentId` ✅
   - `expiryDate` (timestamp) ✅
   - `createdAt` (timestamp) ✅
   - `ownerUid` ✅

---

## 🐛 Common Issues & Solutions

### Issue 1: No suggestions appear
**Cause:** API key issue or network error  
**Check:**
- Verify `NEXT_GOOGLE_PLACES_API_KEY` in `.env.local`
- Check browser Network tab for 401/403 errors
- Ensure API key has Places API enabled

---

### Issue 2: "Location restricted" for Dhamtari business
**Cause:** Incorrect boundary coordinates  
**Check:**
- Business lat/lng in response
- Should be: lat 20.9-21.9, lng 81.0-82.2
- If boundary is wrong, update in `/api/google-places/details/route.ts`

---

### Issue 3: Payment fails
**Cause:** Razorpay test mode or key issue  
**Check:**
- Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env.local`
- Ensure using test card: 4111 1111 1111 1111
- Check browser console for Razorpay errors

---

### Issue 4: Photos don't upload
**Cause:** Firebase Storage permission issue  
**Check:**
- Firebase Storage rules allow writes
- File size < 5MB
- File type is image/*

---

### Issue 5: Draft doesn't restore
**Cause:** LocalStorage quota exceeded  
**Solution:**
- Clear browser LocalStorage
- Reduce draft size
- Check browser console for errors

---

## ✅ Success Criteria

**All tests pass if:**
1. ✅ Google Places autocomplete works
2. ✅ Dhamtari location restriction enforced
3. ✅ Auto-save and draft recovery functional
4. ✅ All form validations working
5. ✅ Photo limits enforced per plan
6. ✅ Payment flow completes successfully
7. ✅ Listing created in Firestore
8. ✅ No TypeScript errors
9. ✅ No console errors
10. ✅ Mobile responsive (test on phone)

---

## 📞 Need Help?

- Check implementation docs: `IMPLEMENTATION_COMPLETE.md`
- Review Google Places API docs: [Link in original prompt]
- Review Razorpay docs: [Link in original prompt]

---

**Happy Testing! 🎉**
