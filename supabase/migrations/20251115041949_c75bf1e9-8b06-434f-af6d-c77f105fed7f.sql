-- Adiciona política RLS para permitir usuários inserirem seus próprios perfis
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);