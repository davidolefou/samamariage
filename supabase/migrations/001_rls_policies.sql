-- ============================================================
-- RLS POLICIES — SamaMariage
-- À exécuter dans Supabase SQL Editor après les migrations Drizzle
-- ============================================================

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceremonies ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ndawtal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE fabric_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USERS — chaque user voit/modifie son propre profil
-- ============================================================
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = auth_id);

CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = auth_id);

-- ============================================================
-- WEDDINGS — chaque mariée voit son propre mariage
-- ============================================================
CREATE POLICY "weddings_select_own" ON weddings
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    OR is_public = true
  );

CREATE POLICY "weddings_insert_own" ON weddings
  FOR INSERT WITH CHECK (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "weddings_update_own" ON weddings
  FOR UPDATE USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "weddings_delete_own" ON weddings
  FOR DELETE USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- ============================================================
-- CEREMONIES, TASKS — héritent des droits du wedding
-- ============================================================
CREATE POLICY "ceremonies_via_wedding" ON ceremonies
  FOR ALL USING (
    wedding_id IN (
      SELECT id FROM weddings
      WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "wedding_tasks_via_wedding" ON wedding_tasks
  FOR ALL USING (
    wedding_id IN (
      SELECT id FROM weddings
      WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- ============================================================
-- BUDGETS — liés au wedding de la mariée
-- ============================================================
CREATE POLICY "budgets_via_wedding" ON budgets
  FOR ALL USING (
    wedding_id IN (
      SELECT id FROM weddings
      WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "budget_categories_via_budget" ON budget_categories
  FOR ALL USING (
    budget_id IN (
      SELECT b.id FROM budgets b
      JOIN weddings w ON w.id = b.wedding_id
      WHERE w.user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "budget_items_via_category" ON budget_items
  FOR ALL USING (
    category_id IN (
      SELECT bc.id FROM budget_categories bc
      JOIN budgets b ON b.id = bc.budget_id
      JOIN weddings w ON w.id = b.wedding_id
      WHERE w.user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- ============================================================
-- NDAWTAL — privé, lié au wedding
-- ============================================================
CREATE POLICY "ndawtal_via_wedding" ON ndawtal_records
  FOR ALL USING (
    wedding_id IN (
      SELECT id FROM weddings
      WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "return_obligations_via_wedding" ON return_obligations
  FOR ALL USING (
    wedding_id IN (
      SELECT id FROM weddings
      WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- ============================================================
-- VENDORS — lecture publique si publié, écriture si propriétaire
-- ============================================================
CREATE POLICY "vendors_select_public" ON vendors
  FOR SELECT USING (is_published = true OR user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "vendors_insert_own" ON vendors
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "vendors_update_own" ON vendors
  FOR UPDATE USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "vendor_services_via_vendor" ON vendor_services
  FOR SELECT USING (
    vendor_id IN (SELECT id FROM vendors WHERE is_published = true)
    OR vendor_id IN (SELECT id FROM vendors WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid()))
  );

-- ============================================================
-- BOOKINGS & QUOTES — mariée et prestataire voient les leurs
-- ============================================================
CREATE POLICY "quote_requests_mariee" ON quote_requests
  FOR ALL USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
    OR
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "bookings_own" ON bookings
  FOR ALL USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
    OR
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

-- ============================================================
-- GUESTS — lié au wedding, RSVP public via invite_code
-- ============================================================
CREATE POLICY "guests_via_wedding" ON guests
  FOR ALL USING (
    wedding_id IN (
      SELECT id FROM weddings WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "guests_rsvp_public" ON guests
  FOR UPDATE USING (invite_code IS NOT NULL)
  WITH CHECK (invite_code IS NOT NULL);

-- ============================================================
-- PAYMENTS & SUBSCRIPTIONS — user propre uniquement
-- ============================================================
CREATE POLICY "payments_own" ON payments
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "subscriptions_own" ON subscriptions
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- ============================================================
-- NOTIFICATIONS — user propre uniquement
-- ============================================================
CREATE POLICY "notifications_own" ON notifications
  FOR ALL USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- ============================================================
-- REVIEWS — lecture publique, écriture authentifiée
-- ============================================================
CREATE POLICY "reviews_select_public" ON reviews
  FOR SELECT USING (is_published = true);

CREATE POLICY "reviews_insert_auth" ON reviews
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- ============================================================
-- AI INTERACTIONS — user propre uniquement
-- ============================================================
CREATE POLICY "ai_interactions_own" ON ai_interactions
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));
