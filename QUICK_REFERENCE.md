# CHIARA Clinic Management System - Quick Reference Guide

**Last Updated:** May 10, 2026

---

## Quick Navigation

| Section | Purpose |
|---------|---------|
| **Comprehensive Documentation** | Full system overview, architecture, API docs, business logic |
| **ERD Guide** | Entity relationship diagrams in Mermaid format for mermaid.live |
| **This Guide** | Quick reference and checklists |

---

## System At A Glance

```
CHIARA Clinic Management System
├─ Frontend: Next.js 16, React 19, Tailwind 4
├─ Backend: Supabase PostgreSQL + REST API
├─ Auth: Supabase Auth (JWT)
├─ Payments: PayMongo (online bookings)
├─ Notifications: EmailJS + Twilio
└─ Hosting: Vercel
```

### Core Entities (17 tables)
1. **PROFILES** - Users (extends auth.users)
2. **PATIENTS** - Patient-specific data
3. **DOCTORS** - Doctor profiles
4. **DOCTOR_SCHEDULES** - Recurring availability
5. **DOCTOR_UNAVAILABILITY** - One-off blocks
6. **APPOINTMENTS** - Core booking record
7. **ONLINE_BOOKING_RESERVATIONS** - Payment pipeline
8. **CONSULTATION_NOTES** - Medical records
9. **VITAL_SIGNS** - Biometric data
10. **BILLINGS** - Invoices
11. **BILLING_ITEMS** - Line items
12. **PRICING** - Service catalog
13. **PAYMENTS** - Transactions
14. **NOTIFICATIONS** - Alerts queue
15. **SYSTEM_SETTINGS** - Config (singleton)
16. **LANDING_CONTENT** - CMS (singleton)
17. **AUDIT_LOG** - Change tracking

---

## 5-Minute System Walkthrough

### 1. Patient Registers
```
→ Sign up via /register
→ Create auth.users (Supabase)
→ Trigger creates profiles + patients rows
→ Role: 'patient' assigned
```

### 2. View Doctor & Slots
```
→ GET /api/v2/doctors (list active doctors)
→ GET /api/v2/doctors/{id}/schedule
→ App calculates available slots:
   • Get weekly schedule
   • Subtract unavailability blocks
   • Filter slots < max occupancy (5)
   • Return slots with queue positions
```

### 3. Book Appointment
```
→ Patient selects: Doctor, Date, Time, Type (Clinic/Online)
→ POST /api/v2/appointments
   - Clinic: Creates appointment (status='Confirmed')
   - Online: Creates reservation (status='Pending')
            Redirects to PayMongo payment
→ On payment success: Converts reservation → appointment
```

### 4. Clinic Check-in
```
→ Secretary searches patient: GET /api/v2/patients
→ PATCH /api/v2/appointments/{id} (status='CheckedIn')
→ POST /api/v2/vital-signs (record BP, temp, etc.)
```

### 5. Consultation
```
→ Doctor starts: POST /api/v2/appointments/{id}/start
   (status='InProgress')
→ Doctor ends: PATCH /api/v2/appointments/{id}
   (status='Completed')
→ POST /api/v2/consultation-notes (diagnosis, Rx)
```

### 6. Billing
```
→ Secretary creates: POST /api/v2/billings (status='Draft')
→ Add items: POST /api/v2/billing-items
→ Issue invoice: PATCH /api/v2/billings/{id} (status='Issued')
→ Record payment: POST /api/v2/payments
→ Status='Paid'
```

---

## API Quick Reference

### Most Used Endpoints

```bash
# Appointments
GET    /api/v2/appointments              # List
POST   /api/v2/appointments              # Create
GET    /api/v2/appointments/{id}         # Read
PATCH  /api/v2/appointments/{id}         # Update
DELETE /api/v2/appointments/{id}         # Cancel
POST   /api/v2/appointments/{id}/start   # Start consult

# Doctors & Schedules
GET    /api/v2/doctors                   # List doctors
GET    /api/v2/doctors/{id}/schedule     # Get schedule
POST   /api/v2/doctors/{id}/schedule     # Create/update
POST   /api/v2/doctors/{id}/unavailability  # Add block

# Patients
GET    /api/v2/patients                  # List (staff)
POST   /api/v2/patients                  # Register (staff)

# Billing
POST   /api/v2/billings                  # Create invoice
PATCH  /api/v2/billings/{id}             # Issue/void
POST   /api/v2/payments                  # Record payment

# Reports
GET    /api/v2/reports?kind=revenue      # Revenue
GET    /api/v2/reports?kind=patient-volume  # Volume
GET    /api/v2/reports                   # All combined

# CMS
GET    /api/v2/landing-content           # Read (public)
PATCH  /api/v2/landing-content           # Update (super_admin)

# Current User
GET    /api/v2/me                        # Profile + role data
```

### Authentication Header
```
Authorization: Bearer <JWT_TOKEN>
```

---

## User Roles Cheat Sheet

### 5 Roles in Order of Power

| Role | Use Case | Can Do |
|------|----------|--------|
| **SUPER_ADMIN** | System owner (Dr. Chiara) | Everything + user management |
| **ADMIN** | Clinic manager | Staff + settings (limited) |
| **SECRETARY** | Front desk | Check-in, billing, scheduling |
| **DOCTOR** | Medical provider | Consultations, notes, schedule own |
| **PATIENT** | End user | Book appointments, view own records |

### Quick Permission Matrix

|  | Super | Admin | Secy | Dr | Pt |
|--|-------|-------|------|----|----|
| Manage users | ✓ | ✗ | ✗ | ✗ | ✗ |
| System settings | ✓ | ✗ | ✗ | ✗ | ✗ |
| Create appointment | ✓ | ✓ | ✓ | ✗ | ✓ |
| Check-in patient | ✓ | ✓ | ✓ | ✓ | ✗ |
| Record vitals | ✓ | ✓ | ✓ | ✓ | ✗ |
| Write notes | ✓ | ✓ | ✗ | ✓ | ✗ |
| Create billing | ✓ | ✓ | ✓ | ✗ | ✗ |
| View reports | ✓ | ✓ | ✗ | ✓ | ✗ |

---

## Database Quick Reference

### Connection String
```
postgresql://user:password@db.supabase.co:5432/postgres
```

### Key Tables by Feature

#### Appointments
```
appointments (core)
├─ doctor_schedules (availability template)
├─ doctor_unavailability (blocks)
└─ online_booking_reservations (payment pipeline)
```

#### Medical
```
consultation_notes (doctor writes)
vital_signs (secretary/doctor records)
```

#### Billing
```
billings (invoice)
├─ billing_items (line items)
├─ pricing (service catalog)
└─ payments (transactions)
```

#### Users
```
profiles (auth.users extension)
├─ patients (patient data)
└─ doctors (doctor data)
```

---

## Common Tasks

### Create New Appointment
```typescript
POST /api/v2/appointments
{
  "patient_id": "uuid",
  "doctor_id": "uuid",
  "appointment_date": "2026-05-15",
  "start_time": "09:00",
  "end_time": "10:00",
  "appointment_type": "Clinic",
  "reason": "Regular checkup"
}
// Response: { appointment: {..., status: "Confirmed"} }
```

### Check Patient In
```typescript
PATCH /api/v2/appointments/{id}
{
  "status": "CheckedIn"
}
// Then record vitals:
POST /api/v2/vital-signs
{
  "appointment_id": "uuid",
  "bp_systolic": 120,
  "bp_diastolic": 80,
  "temperature_c": 37.2,
  "pulse_rate": 72
}
```

### Create Invoice
```typescript
POST /api/v2/billings
{
  "appointment_id": "uuid",
  "items": [
    { "description": "Consultation", "quantity": 1, "unit_price": 350 }
  ]
}
// Response: { billing: {..., status: "Draft", total: 350} }

// Issue invoice
PATCH /api/v2/billings/{id}
{ "status": "Issued" }

// Record payment
POST /api/v2/payments
{
  "billing_id": "uuid",
  "amount": 350,
  "method": "Cash"
}
```

### Apply Discount
```typescript
PATCH /api/v2/billings/{id}
{
  "discount_kind": "SeniorCitizen",
  "discount_id_number": "12345",
  "discount": 52.50  // 15% of 350
}
// total recalculates: 350 - 52.50 = 297.50
```

### Add Doctor Unavailability
```typescript
POST /api/v2/doctors/{doctor_id}/unavailability
{
  "starts_at": "2026-05-20T00:00:00Z",
  "ends_at": "2026-05-25T00:00:00Z",
  "reason": "Vacation"
}
```

### Get Reports
```typescript
GET /api/v2/reports?kind=revenue&from=2026-05-01&to=2026-05-31
GET /api/v2/reports?kind=patient-volume&from=2026-05-01&to=2026-05-31
GET /api/v2/reports?kind=peak-hours
GET /api/v2/reports?kind=no-show
```

---

## Important Business Rules

### Appointment Constraints
- ✅ Patient can't have overlapping appointments
- ✅ Clinic & Online slots for same doctor can't overlap
- ✅ Max 5 patients per time slot (configurable)
- ✅ Slot duration: 60 minutes (default, configurable)
- ✅ Can't book during doctor's unavailability

### Billing Rules
- ✅ Invoice must have items before issuing
- ✅ Discount max = subtotal (can't go negative)
- ✅ SC/PWD discounts auto-calculated (15% default)
- ✅ Void records who/when/why for audit
- ✅ Only staff can issue/void invoices

### Payment Rules
- ✅ Online appointments require payment before confirmation
- ✅ Clinic appointments can be marked paid after check-in
- ✅ Multiple payment methods supported (Cash, GCash, QR, Card, BankTransfer)
- ✅ PayMongo webhook converts reservation → appointment
- ✅ Payment records are immutable (create-only)

### Consultation Rules
- ✅ Doctor must complete appointment first
- ✅ Each appointment has exactly 1 consultation note (created empty)
- ✅ Only writing doctor can edit own notes
- ✅ Patients can read notes for own appointments

### Vital Signs Rules
- ✅ One record per appointment
- ✅ Secretary records at check-in
- ✅ Doctor can update during consultation
- ✅ Patients can view own vitals
- ✅ Range validation (e.g., temp 25-45°C, BP 0-300 systolic)

---

## Configuration

### System Settings (Singleton - ID=true)

| Setting | Default | Type | Impact |
|---------|---------|------|--------|
| `clinic_name` | 'CHIARA Clinic' | TEXT | Landing page, emails |
| `email` | Empty | TEXT | Contact, notifications |
| `phone` | Empty | TEXT | Contact page |
| `address` | Empty | TEXT | Contact page |
| `online_consultation_fee` | 350 | NUMERIC | Online booking price |
| `max_patients_per_hour` | 5 | SMALLINT | Slot occupancy limit |
| `clinic_open_time` | 08:00 | TIME | Schedule boundary |
| `clinic_close_time` | 17:00 | TIME | Schedule boundary |
| `default_meeting_link` | Empty | TEXT | Online meeting URL template |

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Payments
PAYMONGO_SECRET_KEY=sk_live_xxxxx
PAYMONGO_PUBLIC_KEY=pk_live_xxxxx

# Notifications
EMAILJS_SERVICE_ID=service_xxxxx
EMAILJS_TEMPLATE_ID=template_xxxxx
EMAILJS_USER_ID=user_xxxxx

# Optional: SMS
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=authtoken
TWILIO_PHONE_NUMBER=+1234567890
```

---

## File Structure Quick Map

```
clinicmanagement-system/
│
├── 📄 COMPREHENSIVE_DOCUMENTATION.md  ← FULL DOCS
├── 📄 ERD_MERMAID.md                  ← ERD DIAGRAMS
├── 📄 QUICK_REFERENCE.md              ← THIS FILE
│
├── app/
│   ├── (dashboard)/                   ← Protected routes
│   │   ├── appointments/              ← /dashboard/appointments
│   │   ├── patients/                  ← /dashboard/patients
│   │   ├── payments/                  ← /dashboard/payments
│   │   ├── reports/                   ← /dashboard/reports
│   │   └── ...
│   ├── api/
│   │   ├── v2/
│   │   │   ├── appointments/          ← /api/v2/appointments
│   │   │   ├── doctors/               ← /api/v2/doctors
│   │   │   ├── billings/              ← /api/v2/billings
│   │   │   ├── patients/              ← /api/v2/patients
│   │   │   ├── reports/               ← /api/v2/reports
│   │   │   └── ...
│   ├── auth/                          ← Auth pages
│   ├── login/                         ← Login form
│   ├── register/                      ← Registration
│   └── page.tsx                       ← Landing page
│
├── src/
│   ├── lib/
│   │   ├── services/                  ← BUSINESS LOGIC
│   │   │   ├── booking.ts             ← Appointments
│   │   │   ├── billing.ts             ← Invoices
│   │   │   ├── payment.ts             ← Payments
│   │   │   ├── schedule.ts            ← Schedules
│   │   │   ├── reports.ts             ← Analytics
│   │   │   └── ...
│   │   ├── supabase/                  ← DB client
│   │   ├── auth/                      ← Auth utils
│   │   └── db/
│   │       └── types.ts               ← TypeScript types
│   ├── components/                    ← REACT COMPONENTS
│   │   ├── appointments/
│   │   ├── patients/
│   │   ├── payments/
│   │   ├── dashboard/
│   │   └── layout/
│   └── styles/
│       └── globals.css
│
├── supabase/
│   ├── schema.sql                     ← DATABASE SCHEMA
│   └── migrations/
│       └── *.sql                      ← Schema changes
│
├── public/                            ← Static assets
│
├── package.json                       ← Dependencies
├── next.config.ts                     ← Next.js config
├── tsconfig.json                      ← TypeScript config
└── tailwind.config.js                 ← Tailwind config
```

---

## Debugging Checklist

### Issue: Appointment Creation Fails

- [ ] Patient ID exists in `patients` table?
- [ ] Doctor ID exists in `doctors` table?
- [ ] Doctor has schedule for that day of week?
- [ ] Doctor not unavailable at that time?
- [ ] Slot not already booked by another patient?
- [ ] User authenticated (valid JWT)?
- [ ] User has permission (role check)?

### Issue: Booking Won't Convert After Payment

- [ ] PayMongo webhook received?
- [ ] Webhook URL publicly accessible?
- [ ] Webhook signature verified?
- [ ] ONLINE_BOOKING_RESERVATIONS record exists?
- [ ] Reservation status = 'Paid'?
- [ ] Log errors in: `supabase/logs` or `vercel/logs`

### Issue: Reports Empty

- [ ] Date range queries: `from` and `to` parameters valid?
- [ ] Appointments exist in that range?
- [ ] User authenticated + has permission?
- [ ] Appointments have status != 'Cancelled'?

### Issue: RLS Permissions Denied

- [ ] User role correct in `profiles.role`?
- [ ] RLS policy covers this action (SELECT/UPDATE)?
- [ ] User ID matches record? (for patient_id/doctor_id checks)
- [ ] Staff role check working? (admin/secretary/super_admin)

---

## Performance Tips

### Database Indexes
Key indexes already exist on:
- `appointments(doctor_id, appointment_date)`
- `appointments(patient_id)`
- `notifications(status, send_at)`
- `online_booking_reservations(payment_provider, payment_ref)`

### Query Optimization
- Always filter by `status` for appointments (e.g., exclude 'Cancelled')
- Use `limit(100)` or `limit(200)` on list endpoints
- For reporting, use date filters (don't scan all history)
- Check exclusion constraints prevent DB errors

### Caching
- Doctor list: Cache 5 min (GET /api/v2/doctors)
- System settings: Cache 1 hour (singleton read)
- Landing content: Cache 1 hour (public read)
- Slot availability: Don't cache (real-time)

---

## Deployment Checklist

### Pre-Production
- [ ] `supabase/schema.sql` applied to production DB
- [ ] All migrations in `supabase/migrations/` applied
- [ ] Environment variables set in Vercel
- [ ] PayMongo merchant account configured
- [ ] EmailJS service ready
- [ ] Twilio SMS (optional) configured
- [ ] RLS policies enforced in Supabase
- [ ] Backups enabled in Supabase

### Post-Deployment
- [ ] Test user registration (creates profile + patient)
- [ ] Test doctor booking (slots appear correctly)
- [ ] Test payment flow (online appointment)
- [ ] Test billing workflow (issue → pay)
- [ ] Check notification queue processing
- [ ] Verify reports endpoints return data

---

## Key Contacts & Resources

| Resource | Link |
|----------|------|
| **Documentation** | See COMPREHENSIVE_DOCUMENTATION.md |
| **ERD Diagrams** | See ERD_MERMAID.md, use mermaid.live |
| **Supabase Docs** | https://supabase.com/docs |
| **Next.js Docs** | https://nextjs.org/docs |
| **PayMongo Docs** | https://developers.paymongo.com |
| **Tailwind CSS** | https://tailwindcss.com/docs |

---

## Quick SQL Snippets

### Find Patient's Appointments
```sql
SELECT a.* FROM appointments a
WHERE a.patient_id = '{{patient_uuid}}'
ORDER BY a.appointment_date DESC;
```

### Find Doctor's Availability Today
```sql
SELECT * FROM doctor_schedules
WHERE doctor_id = '{{doctor_uuid}}'
  AND day_of_week = 3 -- 3 = Wednesday
  AND is_active = true;
```

### Revenue Report (This Month)
```sql
SELECT DATE(a.appointment_date) as date, SUM(p.amount) as revenue
FROM payments p
JOIN appointments a ON a.id = p.appointment_id
WHERE p.status = 'Paid'
  AND a.appointment_date >= date_trunc('month', now())
GROUP BY DATE(a.appointment_date)
ORDER BY date DESC;
```

### No-Show Rate
```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'NoShow') as no_shows,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'NoShow') / COUNT(*), 2) as no_show_rate
FROM appointments
WHERE appointment_date >= now() - interval '30 days';
```

### Unpaid Billings
```sql
SELECT b.* FROM billings b
WHERE b.status IN ('Draft', 'Issued')
  AND b.created_at >= now() - interval '7 days'
ORDER BY b.created_at DESC;
```

---

## Support & Next Steps

1. **Full documentation?** → Read `COMPREHENSIVE_DOCUMENTATION.md`
2. **Want ERD diagrams?** → Use `ERD_MERMAID.md` + mermaid.live
3. **API reference?** → See `COMPREHENSIVE_DOCUMENTATION.md` → "API Endpoints"
4. **Database schema?** → See `supabase/schema.sql`
5. **Code browsing?** → Check `src/lib/services/*.ts` for business logic

---

**CHIARA Clinic Management System**  
**Version 1.0 | May 10, 2026**  
**Status: Production Ready**
