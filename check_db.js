const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, val] = line.split('=');
  if (key && val) env[key.trim()] = val.trim();
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'] || '';
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  const { data: prod } = await supabase.from('products').select('*');
  const { data: top } = await supabase.from('toppings').select('*');
  const { data: cat } = await supabase.from('categories').select('*');

  const result = {
    products: prod,
    toppings: top,
    categories: cat
  };

  fs.writeFileSync('C:\\Users\\LAPTOPSMP-09\\.gemini\\antigravity-ide\\brain\\67cda3e9-1766-4619-98ab-b080fa4ae560\\scratch\\db_dump.json', JSON.stringify(result, null, 2));
  console.log('Database dumped successfully to scratch/db_dump.json');
}

checkDb();
