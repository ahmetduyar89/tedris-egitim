
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env file manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envConfig: Record<string, string> = {};

envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envConfig[key.trim()] = value.trim();
    }
});

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkModules() {
    console.log('Checking kg_modules table...');
    const { count, error: countError } = await supabase
        .from('kg_modules')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('Error counting modules:', countError);
        return;
    }

    console.log(`Total modules: ${count}`);

    const { data, error } = await supabase
        .from('kg_modules')
        .select('*')
        .limit(5);

    if (error) {
        console.error('Error fetching modules:', error);
        return;
    }

    console.log('Sample modules:', data);
}

checkModules();
