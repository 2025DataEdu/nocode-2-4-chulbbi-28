-- Create storage bucket for travel regulation documents
INSERT INTO storage.buckets (id, name, public) VALUES ('regulations', 'regulations', false);

-- Create policies for regulation documents
CREATE POLICY "Authenticated users can view regulations" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'regulations' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload regulations" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'regulations' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update regulations" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'regulations' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete regulations" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'regulations' AND auth.uid() IS NOT NULL);

-- Create table for managing regulation documents
CREATE TABLE public.regulation_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  content_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  version TEXT DEFAULT '1.0'
);

-- Enable RLS
ALTER TABLE public.regulation_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for regulation_documents table
CREATE POLICY "Authenticated users can view regulation documents" 
ON public.regulation_documents 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert regulation documents" 
ON public.regulation_documents 
FOR INSERT 
WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Authenticated users can update regulation documents" 
ON public.regulation_documents 
FOR UPDATE 
USING (auth.uid() = uploaded_by);

CREATE POLICY "Authenticated users can delete regulation documents" 
ON public.regulation_documents 
FOR DELETE 
USING (auth.uid() = uploaded_by);

-- Create trigger for updating timestamps
CREATE TRIGGER update_regulation_documents_updated_at
BEFORE UPDATE ON public.regulation_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();