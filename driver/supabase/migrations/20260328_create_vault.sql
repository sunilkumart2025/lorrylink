-- Pillar 6.0: Digital Document Vault
-- SQL to create the driver_documents table

CREATE TABLE IF NOT EXISTS driver_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('RC', 'DL', 'INSURANCE', 'PERMIT')),
  document_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'expired')),
  expiry_date DATE,
  verification_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by driver
CREATE INDEX IF NOT EXISTS idx_driver_documents_driver_id ON driver_documents(driver_id);

-- Enable RLS
ALTER TABLE driver_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Drivers can see/manage their own docs
CREATE POLICY "Drivers can view own documents" 
  ON driver_documents FOR SELECT 
  USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can upload own documents" 
  ON driver_documents FOR INSERT 
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can update own documents" 
  ON driver_documents FOR UPDATE
  USING (auth.uid() = driver_id)
  WITH CHECK (auth.uid() = driver_id);
