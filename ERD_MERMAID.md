# CHIARA Clinic Management System - Entity Relationship Diagram (ERD)

## Quick Copy for Mermaid.Live

Paste the diagram code below directly into [https://mermaid.live](https://mermaid.live)

---

## Mermaid ERD Code

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "1:1"
    PROFILES ||--|| PATIENTS : "1:1"
    PROFILES ||--|| DOCTORS : "1:1"
    PROFILES ||--o{ CONSULTATION_NOTES : "writes"
    PROFILES ||--o{ VITAL_SIGNS : "records"
    PROFILES ||--o{ AUDIT_LOG : "performs"
    PROFILES ||--o{ LANDING_CONTENT : "updates"
    PROFILES ||--o{ BILLINGS : "voids"
    PROFILES ||--o{ NOTIFICATIONS : "receives"
    
    PATIENTS ||--o{ APPOINTMENTS : "schedules"
    PATIENTS ||--o{ ONLINE_BOOKING_RESERVATIONS : "creates"
    PATIENTS ||--o{ BILLINGS : "receives"
    PATIENTS ||--o{ CONSULTATION_NOTES : "has"
    
    DOCTORS ||--o{ APPOINTMENTS : "conducts"
    DOCTORS ||--o{ DOCTOR_SCHEDULES : "has"
    DOCTORS ||--o{ DOCTOR_UNAVAILABILITY : "declares"
    DOCTORS ||--o{ CONSULTATION_NOTES : "writes"
    DOCTORS ||--o{ ONLINE_BOOKING_RESERVATIONS : "serves"
    
    APPOINTMENTS ||--|| CONSULTATION_NOTES : "generates"
    APPOINTMENTS ||--|| VITAL_SIGNS : "captures"
    APPOINTMENTS ||--|| BILLINGS : "links"
    APPOINTMENTS ||--o{ PAYMENTS : "receives"
    APPOINTMENTS ||--|| ONLINE_BOOKING_RESERVATIONS : "converts_from"
    
    BILLINGS ||--o{ BILLING_ITEMS : "contains"
    BILLINGS ||--o{ PAYMENTS : "receives"
    BILLINGS ||--|| APPOINTMENTS : "references"
    
    BILLING_ITEMS ||--o{ PRICING : "references"
    
    DOCTOR_SCHEDULES ||--|| DOCTORS : "defines_availability"
    DOCTOR_UNAVAILABILITY ||--|| DOCTORS : "blocks_time"
    
    ONLINE_BOOKING_RESERVATIONS ||--|| APPOINTMENTS : "converts_to"
    
    PRICING ||--o{ BILLING_ITEMS : "prices"
    
    NOTIFICATIONS ||--|| PROFILES : "targets"
    
    SYSTEM_SETTINGS ||--|| CLINIC_CONFIG : "singleton"
    LANDING_CONTENT ||--|| LANDING_CONFIG : "singleton"
    AUDIT_LOG ||--o{ PROFILES : "tracks"
```

---

## Alternative: Detailed Mermaid ERD with Attributes

For a more detailed view with entity attributes, use this version:

```mermaid
erDiagram
    PROFILES {
        uuid id PK
        string email UK
        string phone
        string full_name
        enum role
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    PATIENTS {
        uuid id PK,FK
        date dob
        string gender
        string address
        string emergency_contact
        string family_history
        boolean is_walk_in
    }
    
    DOCTORS {
        uuid id PK,FK
        string specialty
        string license_no UK
        numeric consultation_fee_clinic
        numeric consultation_fee_online
        string slug UK
    }
    
    DOCTOR_SCHEDULES {
        uuid id PK
        uuid doctor_id FK
        smallint day_of_week
        time start_time
        time end_time
        smallint slot_minutes
        enum schedule_mode
        boolean is_active
    }
    
    DOCTOR_UNAVAILABILITY {
        uuid id PK
        uuid doctor_id FK
        timestamp starts_at
        timestamp ends_at
        string reason
    }
    
    APPOINTMENTS {
        uuid id PK
        uuid patient_id FK
        uuid doctor_id FK
        date appointment_date
        time start_time
        time end_time
        enum appointment_type
        enum status
        smallint queue_number
        string reason
        string meeting_link
        tstzrange slot_range
        timestamp created_at
        timestamp updated_at
    }
    
    ONLINE_BOOKING_RESERVATIONS {
        uuid id PK
        uuid patient_id FK
        uuid doctor_id FK
        date appointment_date
        time start_time
        time end_time
        smallint queue_number
        string reason
        numeric amount
        string status
        string payment_provider
        string payment_ref
        uuid appointment_id FK
        timestamp created_at
        timestamp updated_at
    }
    
    CONSULTATION_NOTES {
        uuid id PK
        uuid appointment_id FK,UK
        uuid doctor_id FK
        string chief_complaint
        string diagnosis
        string prescription
        string notes
        timestamp created_at
        timestamp updated_at
    }
    
    VITAL_SIGNS {
        uuid id PK
        uuid appointment_id FK,UK
        uuid recorded_by FK
        smallint bp_systolic
        smallint bp_diastolic
        numeric temperature_c
        smallint pulse_rate
        smallint oxygen_saturation
        smallint respiratory_rate
        numeric weight_kg
        numeric height_cm
        string notes
        timestamp created_at
        timestamp updated_at
    }
    
    BILLINGS {
        uuid id PK
        uuid appointment_id FK,UK
        uuid patient_id FK
        numeric subtotal
        numeric discount
        numeric tax
        numeric total
        string status
        timestamp issued_at
        string discount_kind
        string discount_id_number
        timestamp voided_at
        uuid voided_by FK
        string void_reason
        timestamp created_at
    }
    
    BILLING_ITEMS {
        uuid id PK
        uuid billing_id FK
        uuid pricing_id FK
        string description
        integer quantity
        numeric unit_price
        numeric line_total
    }
    
    PRICING {
        uuid id PK
        string code UK
        string name
        string category
        numeric price
        boolean is_active
    }
    
    PAYMENTS {
        uuid id PK
        uuid appointment_id FK
        uuid billing_id FK
        numeric amount
        enum method
        enum status
        string provider
        string provider_ref
        timestamp paid_at
        numeric tendered_amount
        timestamp created_at
    }
    
    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        string channel
        string template
        jsonb payload
        string status
        string error
        timestamp send_at
        timestamp sent_at
        timestamp created_at
    }
    
    SYSTEM_SETTINGS {
        boolean id PK
        string clinic_name
        string email
        string phone
        string address
        numeric online_consultation_fee
        smallint max_patients_per_hour
        time clinic_open_time
        time clinic_close_time
        string default_meeting_link
        timestamp updated_at
    }
    
    LANDING_CONTENT {
        boolean id PK
        string hero_eyebrow
        string hero_title_line1
        string hero_title_line2
        string hero_subtitle
        string doctor_name
        jsonb testimonials
        jsonb services
        jsonb how_to_steps
        timestamp updated_at
        uuid updated_by FK
    }
    
    AUDIT_LOG {
        bigserial id PK
        uuid actor_id FK
        string action
        string entity
        string entity_id
        jsonb diff
        timestamp at
    }
    
    PROFILES ||--|| PATIENTS : "1:1"
    PROFILES ||--|| DOCTORS : "1:1"
    PROFILES ||--o{ CONSULTATION_NOTES : "writes"
    PROFILES ||--o{ VITAL_SIGNS : "records"
    PROFILES ||--o{ BILLINGS : "voids"
    PROFILES ||--o{ NOTIFICATIONS : "receives"
    PROFILES ||--o{ LANDING_CONTENT : "updates"
    PROFILES ||--o{ AUDIT_LOG : "performs"
    
    PATIENTS ||--o{ APPOINTMENTS : "schedules"
    PATIENTS ||--o{ ONLINE_BOOKING_RESERVATIONS : "creates"
    PATIENTS ||--o{ BILLINGS : "receives"
    PATIENTS ||--o{ CONSULTATION_NOTES : "has"
    
    DOCTORS ||--o{ APPOINTMENTS : "conducts"
    DOCTORS ||--o{ DOCTOR_SCHEDULES : "manages"
    DOCTORS ||--o{ DOCTOR_UNAVAILABILITY : "declares"
    DOCTORS ||--o{ CONSULTATION_NOTES : "writes"
    DOCTORS ||--o{ ONLINE_BOOKING_RESERVATIONS : "serves"
    
    APPOINTMENTS ||--|| CONSULTATION_NOTES : "generates"
    APPOINTMENTS ||--|| VITAL_SIGNS : "captures"
    APPOINTMENTS ||--|| BILLINGS : "links"
    APPOINTMENTS ||--o{ PAYMENTS : "receives"
    APPOINTMENTS ||--|| ONLINE_BOOKING_RESERVATIONS : "converts_from"
    
    BILLINGS ||--o{ BILLING_ITEMS : "contains"
    BILLINGS ||--o{ PAYMENTS : "receives"
    
    BILLING_ITEMS ||--o{ PRICING : "references"
    
    DOCTOR_SCHEDULES ||--|| DOCTORS : "defines_availability"
    DOCTOR_UNAVAILABILITY ||--|| DOCTORS : "blocks_time"
    
    ONLINE_BOOKING_RESERVATIONS ||--|| APPOINTMENTS : "converts_to"
    
    PRICING ||--o{ BILLING_ITEMS : "prices"
    
    NOTIFICATIONS ||--|| PROFILES : "targets"
    
    AUDIT_LOG ||--o{ PROFILES : "tracks"
```

---

## Entity Relationship Legend

### Relationship Symbols

| Symbol | Meaning |
|--------|---------|
| `\|\|--\|\|` | One-to-One (1:1) |
| `\|\|--o{` | One-to-Many (1:N) |
| `o{--o{` | Many-to-Many (M:N) |

### Key Indicators

| Symbol | Meaning |
|--------|---------|
| `PK` | Primary Key |
| `FK` | Foreign Key |
| `UK` | Unique Key |

---

## Key Relationships Summary

### 1. **Authentication & Profiles**
- **PROFILES** (extends auth.users)
  - 1:1 with PATIENTS (if role='patient')
  - 1:1 with DOCTORS (if role='doctor')

### 2. **Appointment Workflow**
- **PATIENTS** → (1:N) → **APPOINTMENTS** ← (N:1) ← **DOCTORS**
- **APPOINTMENTS** → (1:1) → **CONSULTATION_NOTES**
- **APPOINTMENTS** → (1:1) → **VITAL_SIGNS**
- **APPOINTMENTS** → (1:1) → **BILLINGS**

### 3. **Doctor Availability**
- **DOCTORS** → (1:N) → **DOCTOR_SCHEDULES** (recurring template)
- **DOCTORS** → (1:N) → **DOCTOR_UNAVAILABILITY** (one-off blocks)

### 4. **Online Booking Pipeline**
- **PATIENTS** → (1:N) → **ONLINE_BOOKING_RESERVATIONS** ← (N:1) ← **DOCTORS**
- **ONLINE_BOOKING_RESERVATIONS** → (1:1) → **APPOINTMENTS** (upon payment conversion)

### 5. **Billing & Payments**
- **PATIENTS** → (1:N) → **BILLINGS**
- **BILLINGS** → (1:N) → **BILLING_ITEMS** ← (N:1) ← **PRICING**
- **BILLINGS** → (1:N) → **PAYMENTS**
- **APPOINTMENTS** → (1:N) → **PAYMENTS**

### 6. **Medical Records**
- **CONSULTATION_NOTES** ← (N:1) ← **DOCTORS** (writer)
- **VITAL_SIGNS** ← (N:1) ← **PROFILES** (recorded_by staff member)

### 7. **System Configuration**
- **SYSTEM_SETTINGS** (singleton: id=true)
- **LANDING_CONTENT** (singleton: id=true)
- **AUDIT_LOG** (tracks all changes)

### 8. **Notifications**
- **PROFILES** → (1:N) → **NOTIFICATIONS** (user_id)

---

## How to Use in Mermaid.Live

1. Go to [https://mermaid.live](https://mermaid.live)
2. Click **Code** or **Edit** button
3. Clear the default diagram
4. Paste one of the Mermaid codes above (simple or detailed)
5. Click **Render** or press `Ctrl+Enter`
6. Use the **Export** button to save as PNG/SVG

### Tips
- **Simple version:** Best for presentations, high-level understanding
- **Detailed version:** Best for development, shows all attributes and keys
- **Zoom:** Use your browser's zoom to adjust size
- **Export:** PNG for slides, SVG for vector editing in design tools

---

## Additional Schema Details

### Critical Constraints

```sql
-- Patient no-overlap (GiST exclusion)
CONSTRAINT patient_no_overlap EXCLUDE USING gist (
  patient_id WITH =,
  slot_range WITH &&
) WHERE (status NOT IN ('Cancelled','NoShow'));

-- Doctor clinic/online conflict (GiST exclusion)
CONSTRAINT doctor_shared_slot_type_conflict EXCLUDE USING gist (
  doctor_id WITH =,
  appointment_type WITH <>,
  slot_range WITH &&
) WHERE (status NOT IN ('Cancelled','NoShow'));

-- Doctor unavailability overlap (GiST exclusion)
CONSTRAINT doctor_unavailability_overlap EXCLUDE USING gist (
  doctor_id WITH =,
  tstzrange(starts_at, ends_at, '[)') WITH &&
);
```

### Enums

```sql
user_role: 'super_admin', 'admin', 'secretary', 'doctor', 'patient'
appt_type: 'Clinic', 'Online'
schedule_mode: 'Clinic', 'Online', 'Both'
appt_status: 'PendingPayment', 'Confirmed', 'CheckedIn', 'InProgress', 'Completed', 'Cancelled', 'NoShow'
payment_status: 'Pending', 'Paid', 'Failed', 'Refunded'
payment_method: 'Cash', 'GCash', 'QR', 'Card', 'BankTransfer'
```

---

**Created:** May 10, 2026  
**For:** CHIARA Clinic Management System  
**Format:** Mermaid.js ERD  
**Compatibility:** Mermaid Live, Markdown Renderers, Confluence, GitHub

