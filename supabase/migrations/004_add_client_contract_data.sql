-- 004_add_client_contract_data.sql
-- Add contract and payment tracking fields to clients table

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS contract_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS service_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS service_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('current', 'overdue', 'pending', 'paid', 'unpaid')) DEFAULT 'pending';

-- Add comment to explain columns
COMMENT ON COLUMN clients.contract_date IS 'Date when the monthly service contract was signed';
COMMENT ON COLUMN clients.service_start_date IS 'Date when the service actually began';
COMMENT ON COLUMN clients.service_end_date IS 'Date when the current service period ends';
COMMENT ON COLUMN clients.payment_status IS 'Current administrative status of the client';
