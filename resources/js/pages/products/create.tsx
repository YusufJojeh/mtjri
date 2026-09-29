import { router, usePage } from '@inertiajs/react';
import { ProductEditor, type ProductPayload, type VisitCallbacks } from '@/components/products/product-editor';

interface PageProps {
    categories: Array<{ id: number; name: string }>;
    taxes: Array<{ id: number; name: string; rate: number | string }>;
}

export default function CreateProduct() {
    const { categories, taxes } = usePage().props as unknown as PageProps;

    // Same route and payload as before: products.store with the form data,
    // named variants and named custom fields.
    const submit = (productData: ProductPayload, visit: VisitCallbacks) => {
        router.post(route('products.store'), productData as unknown as Parameters<typeof router.post>[1], visit);
    };

    return <ProductEditor mode="create" categories={categories ?? []} taxes={taxes ?? []} submit={submit} />;
}
