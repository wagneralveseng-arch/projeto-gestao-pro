-- Criar bucket para fotos de projetos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-photos', 'project-photos', true);

-- Política para visualizar fotos
CREATE POLICY "Fotos são publicamente acessíveis"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-photos');

-- Política para upload de fotos
CREATE POLICY "Usuários podem fazer upload de fotos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-photos' AND auth.uid() IS NOT NULL);

-- Política para deletar fotos
CREATE POLICY "Usuários podem deletar suas fotos"
ON storage.objects FOR DELETE
USING (bucket_id = 'project-photos' AND auth.uid() IS NOT NULL);

-- Adicionar campo de fotos na tabela projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS photo_urls text[];

-- Adicionar campo de avatar no profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url text;