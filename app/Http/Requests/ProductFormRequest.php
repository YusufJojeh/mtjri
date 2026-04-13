<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProductFormRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'specifications' => 'nullable|string',
            'details' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'sale_price' => 'nullable|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'cover_image' => 'nullable|string',
            'images' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id',
            'tax_id' => 'nullable|exists:taxes,id',
            'is_active' => 'nullable|boolean',
            'is_downloadable' => 'nullable|boolean',
            'downloadable_file' => 'nullable|string',
            'variants' => 'nullable|array',
            'custom_fields' => 'nullable|array',
        ];
    }

    /**
     * Function: messages
     * @return array
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Please enter the product name.',
            'name.string' => 'The product name must be a string.',
            'name.max' => 'The product name may not be greater than 255 characters.',
            'sku.string' => 'The SKU must be a string.',
            'sku.max' => 'The SKU may not be greater than 100 characters.',
            'description.string' => 'The product description must be a string.',
            'specifications.string' => 'The product specifications must be a string.',
            'details.string' => 'The product details must be a string.',
            'price.required' => 'Please enter the product price.',
            'price.numeric' => 'The product price must be a number.',
            'price.min' => 'The product price must be at least 0.',
            'sale_price.numeric' => 'The sale price must be a number.',
            'sale_price.min' => 'The sale price must be at least 0.',
            'stock.required' => 'Please enter the product stock.',
            'stock.integer' => 'The product stock must be an integer.',
            'stock.min' => 'The product stock must be at least 0.',
            'cover_image.string' => 'The cover image must be a string.',
            'images.string' => 'The images must be a string.',
            'category_id.exists' => 'The selected category does not exist.',
            'tax_id.exists' => 'The selected tax does not exist.',
            'is_active.boolean' => 'The active status must be a boolean.',
            'is_downloadable.boolean' => 'The downloadable status must be a boolean.',
            'downloadable_file.string' => 'The downloadable file must be a string.',
            'variants.array' => 'The variants must be an array.',
            'custom_fields.array' => 'The custom fields must be an array.',
        ];
    }
}
