import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ugkihftmwfkzmgwvzydi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVna2loZnRtd2Zrem1nd3Z6eWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MTgxNDgsImV4cCI6MjA4MzI5NDE0OH0.Qe9ZJrwtofR0BpqSwLmYVZzF4rMip13WYuipW8mY1pI';

export const supabase = createClient(supabaseUrl, supabaseKey);
