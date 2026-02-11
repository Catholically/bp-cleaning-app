-- Aggiungi campo user_id alla tabella workers
-- Esegui questo SQL nella Supabase Dashboard: SQL Editor

-- Aggiungi colonna user_id
ALTER TABLE workers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Crea indice per ricerche veloci
CREATE INDEX IF NOT EXISTS idx_workers_user_id ON workers(user_id);

-- Verifica
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'workers' AND column_name = 'user_id';
