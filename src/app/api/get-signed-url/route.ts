import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE!;

const supabaseAdmin = createClient(
    supabaseUrl,
    supabaseServiceRole
);

export async function POST(req: NextRequest) {
    try {
        const { resumePath } = await req.json();

        if (!resumePath) {
            return NextResponse.json(
                { error: 'No resumePath provided' },
                { status: 400 }
            );
        }

        console.log('Generating signed URL for:', resumePath);

        // Extract bucket and file path from the URL
        // URL format: /storage/v1/object/{public|private|authenticated}/{bucket}/{filepath}
        const urlRegex = /\/storage\/v1\/object\/(public|private|authenticated)\/([^\/]+)\/(.+)/;
        const match = resumePath.match(urlRegex);

        if (!match) {
            console.error('Invalid path format:', resumePath);
            return NextResponse.json(
                { error: 'Invalid resume path format' },
                { status: 400 }
            );
        }

        const [, , bucket, filePath] = match;

        try {
            // Use service role to create signed URL (has full access)
            const { data, error } = await supabaseAdmin.storage
                .from(bucket)
                .createSignedUrl(filePath, 604800); // 7 days expiry

            if (error) {
                console.error('Signed URL creation error:', error);
                throw error;
            }

            if (data?.signedUrl) {
                console.log('Signed URL generated successfully');
                return NextResponse.json({ signedUrl: data.signedUrl });
            } else {
                console.error('No signed URL in response data:', data);
                throw new Error('No signed URL generated');
            }
        } catch (error: any) {
            console.error('Error creating signed URL with service role:', error.message);
            return NextResponse.json(
                { error: `Failed to generate signed URL: ${error.message}` },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error('Get signed URL error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
