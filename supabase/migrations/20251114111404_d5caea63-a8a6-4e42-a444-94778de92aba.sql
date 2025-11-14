-- Add avatar_url column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  cpf_cnpj text,
  address text,
  city text,
  state text,
  zip_code text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for suppliers
CREATE POLICY "Usuários podem ver seus próprios fornecedores"
ON public.suppliers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios fornecedores"
ON public.suppliers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios fornecedores"
ON public.suppliers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios fornecedores"
ON public.suppliers FOR DELETE
USING (auth.uid() = user_id);

-- Add photo_urls column to tasks table for task photos
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS photo_urls text[];

-- Add customer_name and supplier_name to transactions for direct input fallback
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS customer_id uuid;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS supplier_id uuid;