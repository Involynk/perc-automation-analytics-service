-- ============================================================================
-- PERC Admission Operations Engine — Supabase / PostgreSQL Schema
-- ============================================================================

-- ============================================================================
-- 1. USERS — Admins, Counselors, Teachers
-- ============================================================================
CREATE TABLE users (
    id              TEXT PRIMARY KEY,
    email           TEXT UNIQUE NOT NULL,
    name            TEXT NOT NULL,
    role            TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'counselor', 'teacher', 'student')),
    phone           TEXT,
    avatar_url      TEXT,
    notification_preferences TEXT DEFAULT '{}',
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- 2. LEADS — Aggregate root
-- ============================================================================
CREATE TABLE leads (
    id                  TEXT PRIMARY KEY,
    first_name          TEXT NOT NULL,
    last_name           TEXT,
    phone               TEXT,
    email               TEXT,
    source              TEXT NOT NULL,
    source_reference_id TEXT,
    category            TEXT,
    status              TEXT NOT NULL DEFAULT 'new'
                        CHECK (status IN (
                            'new', 'information_shared', 'waiting', 'interested',
                            'call_scheduled', 'meeting_completed', 'demo_scheduled',
                            'admission_pending', 'admitted', 'inactive',
                            'recovery', 'lost', 'closed'
                        )),
    classification      TEXT CHECK (classification IN (
                            'hot', 'warm', 'cold', 'returning',
                            'referral', 'high_priority', 'scholarship_candidate', 'vip'
                        )),
    assigned_to         TEXT REFERENCES users(id),
    assigned_at         TIMESTAMPTZ,
    last_contacted_at   TIMESTAMPTZ,
    next_scheduled_action TEXT,
    metadata            TEXT DEFAULT '{}',
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);
CREATE INDEX idx_leads_created ON leads(created_at);
CREATE INDEX idx_leads_classification ON leads(classification);

-- ============================================================================
-- 3. COURSES — Course catalog
-- ============================================================================
CREATE TABLE courses (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    description     TEXT,
    duration        TEXT,
    eligibility     TEXT,
    subjects        TEXT,
    curriculum      TEXT,
    learning_outcomes TEXT,
    batch_timings   TEXT,
    faculty         TEXT,
    brochure_url    TEXT,
    pdf_url         TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_courses_name ON courses(name);

-- ============================================================================
-- 4. LEAD_COURSES — Many-to-many: leads interested in courses
-- ============================================================================
CREATE TABLE lead_courses (
    lead_id         TEXT NOT NULL REFERENCES leads(id),
    course_id       TEXT NOT NULL REFERENCES courses(id),
    interest_level  TEXT CHECK (interest_level IN ('high', 'medium', 'low')),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (lead_id, course_id)
);

CREATE INDEX idx_lead_courses_course ON lead_courses(course_id);

-- ============================================================================
-- 5. TAGS — Classification tags
-- ============================================================================
CREATE TABLE tags (
    id              TEXT PRIMARY KEY,
    name            TEXT UNIQUE NOT NULL,
    color           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. LEAD_TAGS — Many-to-many: leads ↔ tags
-- ============================================================================
CREATE TABLE lead_tags (
    lead_id         TEXT NOT NULL REFERENCES leads(id),
    tag_id          TEXT NOT NULL REFERENCES tags(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (lead_id, tag_id)
);

CREATE INDEX idx_lead_tags_tag ON lead_tags(tag_id);

-- ============================================================================
-- 7. CHANNELS — Communication channels
-- ============================================================================
CREATE TABLE channels (
    id              TEXT PRIMARY KEY,
    name            TEXT UNIQUE NOT NULL
                    CHECK (name IN (
                        'whatsapp', 'instagram', 'facebook', 'email',
                        'website_form', 'website_chat', 'google_business',
                        'phone', 'walkin', 'referral', 'sms'
                    )),
    display_name    TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    config          TEXT DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. CONVERSATIONS — Group messages per lead per channel
-- ============================================================================
CREATE TABLE conversations (
    id                      TEXT PRIMARY KEY,
    lead_id                 TEXT NOT NULL REFERENCES leads(id),
    channel_id              TEXT NOT NULL REFERENCES channels(id),
    external_conversation_id TEXT,
    status                  TEXT DEFAULT 'active'
                            CHECK (status IN ('active', 'closed', 'archived')),
    started_at              TIMESTAMPTZ DEFAULT NOW(),
    ended_at                TIMESTAMPTZ,
    metadata                TEXT DEFAULT '{}'
);

CREATE INDEX idx_conversations_lead ON conversations(lead_id);
CREATE INDEX idx_conversations_channel ON conversations(channel_id);
CREATE INDEX idx_conversations_external ON conversations(external_conversation_id);

-- ============================================================================
-- 9. MESSAGES — Every inbound and outbound message
-- ============================================================================
CREATE TABLE messages (
    id                  TEXT PRIMARY KEY,
    conversation_id     TEXT NOT NULL REFERENCES conversations(id),
    lead_id             TEXT NOT NULL REFERENCES leads(id),
    direction           TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    channel_message_id  TEXT,
    content_type        TEXT NOT NULL
                        CHECK (content_type IN (
                            'text', 'image', 'document', 'template',
                            'video', 'audio', 'location', 'sticker', 'button'
                        )),
    content             TEXT NOT NULL,
    template_id         TEXT,
    metadata            TEXT DEFAULT '{}',
    sent_at             TIMESTAMPTZ DEFAULT NOW(),
    delivered_at        TIMESTAMPTZ,
    read_at             TIMESTAMPTZ,
    status              TEXT DEFAULT 'sent'
                        CHECK (status IN ('sent', 'delivered', 'read', 'failed'))
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_lead ON messages(lead_id);
CREATE INDEX idx_messages_direction ON messages(direction);
CREATE INDEX idx_messages_sent ON messages(sent_at);

-- ============================================================================
-- 10. MESSAGE_ATTACHMENTS — Files attached to messages
-- ============================================================================
CREATE TABLE message_attachments (
    id              TEXT PRIMARY KEY,
    message_id      TEXT NOT NULL REFERENCES messages(id),
    file_name       TEXT NOT NULL,
    file_url        TEXT NOT NULL,
    file_type       TEXT,
    file_size       INTEGER,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attachments_message ON message_attachments(message_id);

-- ============================================================================
-- 11. EVENT_TYPES — Controlled vocabulary for timeline events
-- ============================================================================
CREATE TABLE event_types (
    id              TEXT PRIMARY KEY,
    name            TEXT UNIQUE NOT NULL,
    description     TEXT,
    category        TEXT CHECK (category IN ('system', 'lead', 'admin', 'automation')),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 12. TIMELINE_EVENTS — Immutable chronological event log
-- ============================================================================
CREATE TABLE timeline_events (
    id              TEXT PRIMARY KEY,
    lead_id         TEXT NOT NULL REFERENCES leads(id),
    event_type_id   TEXT NOT NULL REFERENCES event_types(id),
    actor_type      TEXT NOT NULL CHECK (actor_type IN ('system', 'admin', 'lead', 'automation')),
    actor_id        TEXT,
    description     TEXT NOT NULL,
    metadata        TEXT DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_timeline_lead ON timeline_events(lead_id);
CREATE INDEX idx_timeline_created ON timeline_events(created_at);
CREATE INDEX idx_timeline_type ON timeline_events(event_type_id);

-- ============================================================================
-- 13. WORKFLOW_INSTANCES — One active workflow per lead
-- ============================================================================
CREATE TABLE workflow_instances (
    id              TEXT PRIMARY KEY,
    lead_id         TEXT NOT NULL UNIQUE REFERENCES leads(id),
    current_state   TEXT NOT NULL
                    CHECK (current_state IN (
                        'new', 'information_shared', 'waiting', 'interested',
                        'call_scheduled', 'meeting_completed', 'demo_scheduled',
                        'admission_pending', 'admitted', 'inactive',
                        'recovery', 'lost', 'closed'
                    )),
    previous_state  TEXT,
    is_paused       BOOLEAN DEFAULT FALSE,
    is_completed    BOOLEAN DEFAULT FALSE,
    completed_at    TIMESTAMPTZ,
    metadata        TEXT DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workflow_lead ON workflow_instances(lead_id);
CREATE INDEX idx_workflow_state ON workflow_instances(current_state);

-- ============================================================================
-- 14. WORKFLOW_HISTORY — Audit trail of state transitions
-- ============================================================================
CREATE TABLE workflow_history (
    id              TEXT PRIMARY KEY,
    workflow_id     TEXT NOT NULL REFERENCES workflow_instances(id),
    lead_id         TEXT NOT NULL REFERENCES leads(id),
    from_state      TEXT NOT NULL,
    to_state        TEXT NOT NULL,
    trigger_event   TEXT,
    triggered_by    TEXT NOT NULL CHECK (triggered_by IN ('system', 'admin', 'automation')),
    triggered_by_id TEXT,
    metadata        TEXT DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workflow_history_workflow ON workflow_history(workflow_id);
CREATE INDEX idx_workflow_history_lead ON workflow_history(lead_id);
CREATE INDEX idx_workflow_history_created ON workflow_history(created_at);

-- ============================================================================
-- 15. AUTOMATION_RULES — Business rules that drive the workflow
-- ============================================================================
CREATE TABLE automation_rules (
    id                  TEXT PRIMARY KEY,
    name                TEXT NOT NULL,
    description         TEXT,
    trigger_event       TEXT NOT NULL,
    condition_expression TEXT,
    action_definition   TEXT NOT NULL,
    priority            INTEGER DEFAULT 0,
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_automation_rules_event ON automation_rules(trigger_event);
CREATE INDEX idx_automation_rules_active ON automation_rules(is_active);

-- ============================================================================
-- 16. PROMISES — Every scheduled future action
-- ============================================================================
CREATE TABLE promises (
    id                  TEXT PRIMARY KEY,
    lead_id             TEXT NOT NULL REFERENCES leads(id),
    workflow_id         TEXT REFERENCES workflow_instances(id),
    promise_type        TEXT NOT NULL
                        CHECK (promise_type IN (
                            'followup', 'reminder', 'escalation', 'report',
                            'message_delay', 'meeting_reminder', 'recovery',
                            'feedback', 'notification'
                        )),
    status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'executing', 'completed', 'failed', 'cancelled')),
    scheduled_at        TIMESTAMPTZ NOT NULL,
    executed_at         TIMESTAMPTZ,
    cancelled_at        TIMESTAMPTZ,
    cancelled_reason    TEXT,
    payload             TEXT DEFAULT '{}',
    result              TEXT,
    error_message       TEXT,
    retry_count         INTEGER DEFAULT 0,
    max_retries         INTEGER DEFAULT 3,
    is_recurring        BOOLEAN DEFAULT FALSE,
    recurring_interval  TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_promises_lead ON promises(lead_id);
CREATE INDEX idx_promises_status ON promises(status);
CREATE INDEX idx_promises_scheduled ON promises(scheduled_at);
CREATE INDEX idx_promises_type ON promises(promise_type);

-- ============================================================================
-- 17. PROMISE_EXECUTIONS — Execution log of promises
-- ============================================================================
CREATE TABLE promise_executions (
    id              TEXT PRIMARY KEY,
    promise_id      TEXT NOT NULL REFERENCES promises(id),
    status          TEXT NOT NULL CHECK (status IN ('success', 'failed', 'retry')),
    executed_at     TIMESTAMPTZ DEFAULT NOW(),
    duration_ms     INTEGER,
    result          TEXT,
    error_message   TEXT
);

CREATE INDEX idx_promise_executions_promise ON promise_executions(promise_id);

-- ============================================================================
-- 18. TASKS — Pending human actions
-- ============================================================================
CREATE TABLE tasks (
    id              TEXT PRIMARY KEY,
    lead_id         TEXT NOT NULL REFERENCES leads(id),
    assigned_to     TEXT REFERENCES users(id),
    task_type       TEXT NOT NULL
                    CHECK (task_type IN (
                        'call', 'review', 'followup', 'meeting',
                        'approval', 'counseling', 'verification', 'payment'
                    )),
    title           TEXT NOT NULL,
    description     TEXT,
    priority        TEXT DEFAULT 'medium'
                    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status          TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    due_at          TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    completed_by    TEXT REFERENCES users(id),
    source          TEXT,
    metadata        TEXT DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_lead ON tasks(lead_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due ON tasks(due_at);

-- ============================================================================
-- 19. MEETINGS — Calls, meetings, demos
-- ============================================================================
CREATE TABLE meetings (
    id                  TEXT PRIMARY KEY,
    lead_id             TEXT NOT NULL REFERENCES leads(id),
    organizer_id        TEXT REFERENCES users(id),
    meeting_type        TEXT NOT NULL
                        CHECK (meeting_type IN ('call', 'meeting', 'demo')),
    status              TEXT DEFAULT 'scheduled'
                        CHECK (status IN ('scheduled', 'completed', 'missed', 'cancelled')),
    scheduled_at        TIMESTAMPTZ NOT NULL,
    duration_minutes    INTEGER DEFAULT 30,
    completed_at        TIMESTAMPTZ,
    notes               TEXT,
    feedback            TEXT,
    feedback_rating     INTEGER CHECK (feedback_rating IS NULL OR (feedback_rating >= 1 AND feedback_rating <= 5)),
    cancellation_reason TEXT,
    reminder_sent       BOOLEAN DEFAULT FALSE,
    metadata            TEXT DEFAULT '{}',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meetings_lead ON meetings(lead_id);
CREATE INDEX idx_meetings_organizer ON meetings(organizer_id);
CREATE INDEX idx_meetings_scheduled ON meetings(scheduled_at);
CREATE INDEX idx_meetings_status ON meetings(status);

-- ============================================================================
-- 20. DOCUMENTS — Knowledge assets
-- ============================================================================
CREATE TABLE documents (
    id              TEXT PRIMARY KEY,
    document_type   TEXT NOT NULL
                    CHECK (document_type IN (
                        'brochure', 'fee_structure', 'course_doc', 'admission_form',
                        'scholarship_info', 'institution_brochure', 'other'
                    )),
    name            TEXT NOT NULL,
    description     TEXT,
    file_url        TEXT NOT NULL,
    file_type       TEXT,
    file_size       INTEGER,
    version         INTEGER DEFAULT 1,
    is_active       BOOLEAN DEFAULT TRUE,
    metadata        TEXT DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_active ON documents(is_active);

-- ============================================================================
-- 21. TEMPLATES — Pre-approved message templates
-- ============================================================================
CREATE TABLE templates (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    template_type   TEXT NOT NULL
                    CHECK (template_type IN (
                        'welcome', 'general_enquiry', 'course_enquiry', 'fee_enquiry',
                        'scholarship_enquiry', 'branch_enquiry', 'faculty_enquiry',
                        'hostel_enquiry', 'admission_process', 'documents_required',
                        'demo_invitation', 'meeting_confirmation',
                        'followup_1', 'followup_2', 'followup_3', 'recovery',
                        'admission_confirmation', 'payment_reminder',
                        'welcome_student', 'thank_you', 'call_confirmation',
                        'reschedule_confirmation', 'cancellation_notice',
                        'demo_reminder', 'notification'
                    )),
    channel_id      TEXT REFERENCES channels(id),
    content         TEXT NOT NULL,
    variables       TEXT DEFAULT '[]',
    language        TEXT DEFAULT 'en',
    version         INTEGER DEFAULT 1,
    is_active       BOOLEAN DEFAULT TRUE,
    category        TEXT
                    CHECK (category IN (
                        'general', 'fee', 'course', 'followup',
                        'reminder', 'notification', 'meeting', 'recovery'
                    )),
    metadata        TEXT DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_type ON templates(template_type);
CREATE INDEX idx_templates_channel ON templates(channel_id);
CREATE INDEX idx_templates_active ON templates(is_active);

-- ============================================================================
-- 22. ADMISSIONS — Links leads to student enrollment
-- ============================================================================
CREATE TABLE admissions (
    id                  TEXT PRIMARY KEY,
    lead_id             TEXT NOT NULL UNIQUE REFERENCES leads(id),
    student_id          TEXT,
    course_id           TEXT REFERENCES courses(id),
    status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    admission_date      TIMESTAMPTZ,
    documents_verified  BOOLEAN DEFAULT FALSE,
    fee_paid            BOOLEAN DEFAULT FALSE,
    total_fee           NUMERIC,
    discount_amount     NUMERIC DEFAULT 0,
    discount_reason     TEXT,
    payment_plan        TEXT,
    notes               TEXT,
    metadata            TEXT DEFAULT '{}',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admissions_lead ON admissions(lead_id);
CREATE INDEX idx_admissions_status ON admissions(status);
CREATE INDEX idx_admissions_course ON admissions(course_id);

-- ============================================================================
-- 23. STUDENTS — Created after admission
-- ============================================================================
CREATE TABLE students (
    id                  TEXT PRIMARY KEY,
    lead_id             TEXT NOT NULL UNIQUE REFERENCES leads(id),
    admission_id        TEXT,
    first_name          TEXT NOT NULL,
    last_name           TEXT,
    phone               TEXT,
    email               TEXT,
    date_of_birth       TEXT,
    address             TEXT,
    course_id           TEXT REFERENCES courses(id),
    batch               TEXT,
    enrollment_number   TEXT UNIQUE,
    status              TEXT DEFAULT 'active'
                        CHECK (status IN ('active', 'graduated', 'withdrawn', 'transferred')),
    documents           TEXT DEFAULT '{}',
    metadata            TEXT DEFAULT '{}',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_students_lead ON students(lead_id);
CREATE INDEX idx_students_enrollment ON students(enrollment_number);
CREATE INDEX idx_students_status ON students(status);

-- ============================================================================
-- 24. NOTIFICATIONS — Internal admin notifications
-- ============================================================================
CREATE TABLE notifications (
    id                  TEXT PRIMARY KEY,
    user_id             TEXT NOT NULL REFERENCES users(id),
    lead_id             TEXT REFERENCES leads(id),
    notification_type   TEXT NOT NULL
                        CHECK (notification_type IN (
                            'new_lead', 'lead_assigned', 'followup_due',
                            'call_scheduled', 'meeting_scheduled', 'meeting_missed',
                            'admission_completed', 'payment_pending', 'lead_lost',
                            'lead_recovered', 'escalation', 'daily_summary',
                            'weekly_summary', 'critical_alert'
                        )),
    title               TEXT NOT NULL,
    message             TEXT NOT NULL,
    is_read             BOOLEAN DEFAULT FALSE,
    read_at             TIMESTAMPTZ,
    action_url          TEXT,
    priority            TEXT DEFAULT 'normal'
                        CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    metadata            TEXT DEFAULT '{}',
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- ============================================================================
-- 25. ANALYTICS_EVENTS — Raw data points for the Analytics Engine
-- ============================================================================
CREATE TABLE analytics_events (
    id              TEXT PRIMARY KEY,
    lead_id         TEXT REFERENCES leads(id),
    event_type      TEXT NOT NULL,
    event_data      TEXT DEFAULT '{}',
    source          TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created ON analytics_events(created_at);
CREATE INDEX idx_analytics_lead ON analytics_events(lead_id);

-- ============================================================================
-- 26. SETTINGS — System configuration
-- ============================================================================
CREATE TABLE settings (
    id              TEXT PRIMARY KEY,
    key             TEXT UNIQUE NOT NULL,
    value           TEXT NOT NULL,
    description     TEXT,
    category        TEXT,
    is_editable     BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_settings_category ON settings(category);

-- ============================================================================
-- 27. AUDIT_LOGS — Audit trail for sensitive operations
-- ============================================================================
CREATE TABLE audit_logs (
    id              TEXT PRIMARY KEY,
    table_name      TEXT NOT NULL,
    record_id       TEXT NOT NULL,
    action          TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values      TEXT,
    new_values      TEXT,
    changed_by      TEXT REFERENCES users(id),
    ip_address      TEXT,
    changed_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_table ON audit_logs(table_name);
CREATE INDEX idx_audit_record ON audit_logs(record_id);
CREATE INDEX idx_audit_changed ON audit_logs(changed_at);

-- ============================================================================
-- 28. FAQS — Standardized FAQ library
-- ============================================================================
CREATE TABLE faqs (
    id              TEXT PRIMARY KEY,
    question        TEXT NOT NULL,
    answer          TEXT NOT NULL,
    category        TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_faqs_category ON faqs(category);

-- ============================================================================
-- 29. BRANCHES — Branch/location repository
-- ============================================================================
CREATE TABLE branches (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    address         TEXT,
    google_maps_link TEXT,
    contact_number  TEXT,
    working_hours   TEXT,
    branch_manager  TEXT,
    parking_info    TEXT,
    nearby_landmarks TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Add circular foreign keys (tables that reference tables defined later)
-- ============================================================================
ALTER TABLE messages ADD CONSTRAINT fk_messages_template FOREIGN KEY (template_id) REFERENCES templates(id);
ALTER TABLE admissions ADD CONSTRAINT fk_admissions_student FOREIGN KEY (student_id) REFERENCES students(id);
ALTER TABLE students ADD CONSTRAINT fk_students_admission FOREIGN KEY (admission_id) REFERENCES admissions(id);

-- ============================================================================
-- SEED DATA — Default system configuration values
-- ============================================================================
INSERT INTO settings (id, key, value, description, category, is_editable) VALUES
    ('set_work_hrs',     'working_hours',          '{"start": "09:00", "end": "18:00", "timezone": "Asia/Kolkata"}', 'Default working hours', 'calendar', TRUE),
    ('set_followup_tim', 'followup_timings',       '{"first": "2 hours", "second": "1 day", "third": "3 days", "escalation": "24 hours"}', 'Follow-up timing intervals', 'automation', TRUE),
    ('set_meet_dur',     'default_meeting_duration','30', 'Default meeting duration in minutes', 'calendar', TRUE),
    ('set_meet_buf',     'meeting_buffer_minutes', '15', 'Buffer time between meetings', 'calendar', TRUE),
    ('set_max_meet',     'max_meetings_per_day',   '10', 'Maximum meetings per admin per day', 'calendar', TRUE),
    ('set_auto_resp',    'auto_response_enabled',  'true', 'Enable/disable auto responses globally', 'automation', TRUE),
    ('set_notif_pref',   'notification_preferences','{"dashboard": true, "whatsapp": true, "email": false, "push": false}', 'Default notification channels for admins', 'notification', TRUE);

-- Insert default channels
INSERT INTO channels (id, name, display_name, is_active) VALUES
    ('chan_whatsapp',  'whatsapp',       'WhatsApp',           TRUE),
    ('chan_instagram', 'instagram',      'Instagram',          TRUE),
    ('chan_facebook',  'facebook',       'Facebook Messenger', TRUE),
    ('chan_email',     'email',          'Email',              TRUE),
    ('chan_web_form',  'website_form',   'Website Form',       TRUE),
    ('chan_web_chat',  'website_chat',   'Website Chat',       TRUE),
    ('chan_google',    'google_business','Google Business',    TRUE),
    ('chan_phone',     'phone',          'Phone Call',         TRUE),
    ('chan_walkin',    'walkin',         'Walk-in',            TRUE),
    ('chan_referral',  'referral',       'Referral',           TRUE),
    ('chan_sms',       'sms',            'SMS',                TRUE);

-- Insert core event types for the timeline
INSERT INTO event_types (id, name, description, category) VALUES
    ('evt_lead_created',       'Lead Created',        'New enquiry captured',                           'system'),
    ('evt_info_shared',        'Information Shared',  'Automated response sent to lead',                'automation'),
    ('evt_brochure_sent',      'Brochure Sent',       'Brochure attached and sent',                    'automation'),
    ('evt_fee_sent',           'Fee Structure Sent',  'Fee structure document sent',                   'automation'),
    ('evt_course_sent',        'Course Details Sent', 'Course details shared with lead',               'automation'),
    ('evt_reply_received',     'Reply Received',      'Lead replied to a message',                     'lead'),
    ('evt_call_scheduled',     'Call Scheduled',      'Call scheduled with lead',                      'system'),
    ('evt_meeting_scheduled',  'Meeting Scheduled',   'Meeting scheduled with lead',                   'system'),
    ('evt_meeting_completed',  'Meeting Completed',   'Scheduled meeting completed',                   'system'),
    ('evt_meeting_missed',     'Meeting Missed',      'Scheduled meeting was missed',                  'system'),
    ('evt_demo_scheduled',     'Demo Scheduled',      'Demo class scheduled',                          'system'),
    ('evt_demo_completed',     'Demo Completed',      'Demo class completed',                          'system'),
    ('evt_admission_confirmed','Admission Confirmed', 'Lead admitted into a course',                   'system'),
    ('evt_payment_received',   'Payment Received',    'Fee payment received',                          'system'),
    ('evt_workflow_closed',    'Workflow Closed',     'Lead workflow terminated',                      'system'),
    ('evt_followup_sent',      'Follow-up Sent',      'Automated follow-up message sent',              'automation'),
    ('evt_recovery_initiated', 'Recovery Initiated',  'Recovery workflow triggered for inactive lead', 'automation'),
    ('evt_lead_lost',          'Lead Lost',           'Lead marked as lost',                           'admin'),
    ('evt_lead_recovered',     'Lead Recovered',      'Lead recovered from inactive/lost state',       'system'),
    ('evt_admin_action',       'Admin Action',        'Manual action performed by admin',              'admin'),
    ('evt_note_added',         'Note Added',          'Admin added a note to the lead',                'admin');

-- Insert default tags
INSERT INTO tags (id, name, color) VALUES
    ('tag_hot',      'Hot Lead',             '#ef4444'),
    ('tag_warm',     'Warm Lead',            '#f97316'),
    ('tag_cold',     'Cold Lead',            '#6b7280'),
    ('tag_returning','Returning Lead',       '#8b5cf6'),
    ('tag_referral', 'Referral Lead',        '#06b6d4'),
    ('tag_priority', 'High Priority',        '#dc2626'),
    ('tag_scholar',  'Scholarship Candidate', '#10b981'),
    ('tag_vip',      'VIP Lead',             '#f59e0b');
