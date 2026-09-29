import { router, usePage } from '@inertiajs/react';
import { ProductEditor, type ProductPayload, type VisitCallbacks } from '@/components/products/product-editor';

interface PageProps {
    product: any;
    categories: Array<{ id: number; name: string }>;
    taxes: Array<{ id: number; name: string; rate: number | string }>;
}

export default function EditProduct() {
    const { product, categories, taxes } = usePage().props as unknown as PageProps;

    // Same route and payload as before: products.update with the form data,
    // named variants and named custom fields.
    const submit = (productData: ProductPayload, visit: VisitCallbacks) => {
        router.put(route('products.update', product.id), productData as unknown as Parameters<typeof router.post>[1], visit);
    };

    return <ProductEditor mode="edit" product={product} categories={categories ?? []} taxes={taxes ?? []} submit={submit} />;
}
