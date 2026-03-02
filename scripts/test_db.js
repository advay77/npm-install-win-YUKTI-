const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking interviews...");
    const { data: interviews, error: iErr } = await supabase.from('interviews').select('*').limit(3);
    if (iErr) console.error("Interviews error:", iErr);
    else console.log("Interviews sample keys:", interviews.length > 0 ? Object.keys(interviews[0]) : "No data");

    console.log("\nChecking interview-details...");
    const { data: details, error: dErr } = await supabase.from('interview-details').select('*').limit(3);
    if (dErr) console.error("Details error:", dErr);
    else {
        console.log("Details data count:", details.length);
        if (details.length > 0) {
            console.log("Sample details keys:", Object.keys(details[0]));
            // Check if metadata exists in feedback
            const sampleFeedback = details[0].feedback;
            console.log("Sample feedback (raw):", JSON.stringify(sampleFeedback, null, 2));
        }
    }
}

check();
