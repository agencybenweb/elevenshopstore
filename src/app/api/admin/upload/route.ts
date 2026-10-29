import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const dataUrlFallback = formData.get('dataUrl') as string | null;

    if (!file && !dataUrlFallback) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // Try uploading to Supabase Storage if configured
    if (isSupabaseConfigured && file) {
      const client = getServiceRoleClient();
      if (client) {
        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
          const fileName = `prod_${Date.now()}_${cleanName}`;
          const bucketName = 'product-images';

          // Try uploading to bucket
          const { data: uploadData, error: uploadError } = await client.storage
            .from(bucketName)
            .upload(fileName, buffer, {
              contentType: file.type || 'image/jpeg',
              upsert: true,
            });

          let finalUploadData = uploadData;
          let finalUploadError = uploadError;

          if (finalUploadError && (finalUploadError.message?.toLowerCase().includes('not found') || (finalUploadError as any).statusCode === '404' || (finalUploadError as any).error === 'Bucket not found')) {
            try {
              await client.storage.createBucket(bucketName, { public: true });
              const retry = await client.storage
                .from(bucketName)
                .upload(fileName, buffer, {
                  contentType: file.type || 'image/jpeg',
                  upsert: true,
                });
              finalUploadData = retry.data;
              finalUploadError = retry.error;
            } catch (createErr) {
              console.warn('[Upload] Auto-create bucket attempt notice:', createErr);
            }
          }

          if (!finalUploadError && finalUploadData) {
            const { data: urlData } = client.storage.from(bucketName).getPublicUrl(fileName);
            if (urlData?.publicUrl) {
              return NextResponse.json({
                success: true,
                url: urlData.publicUrl,
                storage: 'supabase',
              });
            }
          } else {
            console.warn('[Upload] Supabase storage notice (falling back to optimized data URL):', finalUploadError?.message);
          }
        } catch (storageErr: any) {
          console.warn('[Upload] Supabase storage exception:', storageErr?.message);
        }
      }
    }

    // Fallback: return optimized data URL
    if (dataUrlFallback) {
      return NextResponse.json({
        success: true,
        url: dataUrlFallback,
        storage: 'inline-optimized',
      });
    }

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString('base64');
      const mime = file.type || 'image/jpeg';
      const inlineDataUrl = `data:${mime};base64,${base64}`;
      return NextResponse.json({
        success: true,
        url: inlineDataUrl,
        storage: 'inline',
      });
    }

    return NextResponse.json({ error: 'Erreur traitement image' }, { status: 500 });
  } catch (err: any) {
    console.error('[POST /api/admin/upload] Error:', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur lors de l’envoi' }, { status: 500 });
  }
}
