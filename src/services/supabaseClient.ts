import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey
)

// Get signed URL for resume files by calling server API
export const getSignedResumeUrl = async (resumePath: string) => {
    if (!resumePath) return null;

    try {
        // Call server API to generate signed URL with service role
        const response = await fetch('/api/get-signed-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ resumePath }),
        });

        if (!response.ok) {
            console.error('Failed to get signed URL:', response.status);
            return resumePath;
        }

        const { signedUrl } = await response.json();
        return signedUrl || resumePath;
    } catch (error) {
        console.error('Error generating signed URL:', error);
        return resumePath;
    }
}