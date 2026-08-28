const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sgvbjmikgfsyludmzgbc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNndmJqbWlrZ2ZzeWx1ZG16Z2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MjEwODYsImV4cCI6MjEwMzQ5NzA4Nn0.g4W1Au4hSoQjPxgIKu-wgQIVY282fUhnSi1bR2Av2Wc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Fetching products...');
  const { data, error } = await supabase.from('products').select('*');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Products:', data);
  }
}
test();
