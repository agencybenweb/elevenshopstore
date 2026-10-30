import { NextRequest, NextResponse } from 'next/server';
import { getActiveProductsAsync, saveProduct, deleteProduct } from '@/lib/products-store';
import { Product } from '@/types/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await getActiveProductsAsync();
    return NextResponse.json(
      { products },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur récupération produits' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const product = (await req.json()) as Partial<Product> & { id?: string };
    const saved = await saveProduct(product);
    return NextResponse.json(
      { success: true, product: saved },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur enregistrement produit' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch {
        // no body
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'ID du produit manquant' }, { status: 400 });
    }

    const removed = await deleteProduct(id);
    if (!removed) {
      return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Produit supprimé du catalogue avec succès' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur suppression produit' }, { status: 500 });
  }
}
