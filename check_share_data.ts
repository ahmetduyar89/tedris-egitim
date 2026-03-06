
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkContent() {
    const shareToken = 'YU5vlORXkbLXovlS';

    const { data: share, error: shareError } = await supabase
        .from('public_content_shares')
        .select('*')
        .eq('share_token', shareToken)
        .single();

    if (shareError) {
        console.error('Share error:', shareError);
        return;
    }

    console.log('Share found:', share);

    const { data: content, error: contentError } = await supabase
        .from('content_library')
        .select('*')
        .eq('id', share.content_id)
        .single();

    if (contentError) {
        console.error('Content error:', contentError);
        return;
    }

    console.log('Content keys:', Object.keys(content));
    console.log('Title:', content.title);
    console.log('FileType:', content.file_type);
    console.log('HTML Content length:', content.html_content?.length || 0);
    console.log('HTML Content preview:', content.html_content?.substring(0, 100));
}

checkContent();
