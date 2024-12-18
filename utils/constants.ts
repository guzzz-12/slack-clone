import { PostgrestError } from "@supabase/supabase-js";

// Expresion regular para validar strings de tipo UUID
export const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Verificar si el error es de PostgreSQL
export const isPostgresError = (error: any): error is PostgrestError => {
  return "details" in error;
}