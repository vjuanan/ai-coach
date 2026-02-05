-- Add gym_id to clients table to support Athlete -> Gym hierarchy
ALTER TABLE clients 
ADD COLUMN gym_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_clients_gym_id ON clients(gym_id);

-- Optional: Comment describing the relationship
COMMENT ON COLUMN clients.gym_id IS 'References the Gym (client of type gym) that this athlete belongs to.';
