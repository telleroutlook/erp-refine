-- Fix document_relations.id: add DEFAULT gen_random_uuid() so inserts auto-generate UUID
ALTER TABLE document_relations ALTER COLUMN id SET DEFAULT gen_random_uuid();
