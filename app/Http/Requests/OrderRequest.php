<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class OrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Authorization logic can be added here if needed, 
        // but for now, we'll assume it's handled at the controller/policy level.
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
            'status' => 'required|in:pending,processing,shipped,delivered,cancelled',
            'payment_status' => 'required|in:pending,paid,failed,refunded',
            'tracking_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
            'items' => 'nullable|array',
            'items.*.id' => 'required_with:items|integer|exists:order_items,id',
            'items.*.product_id' => 'required_with:items.*.id|integer|exists:products,id',
            'items.*.quantity' => 'required_with:items.*.id|integer|min:1',
            'items.*.unit_price' => 'required_with:items.*.id|numeric|min:0',
            'items.*.total_price' => 'required_with:items.*.id|numeric|min:0',
            'items.*.product_variants' => 'nullable|array',
        ];
    }

    /**
     * Function: messages
     * @return array
     */
    public function messages(): array
    {
        return [
            'status.required' => 'The order status is required.',
            'status.in' => 'The selected order status is invalid.',
            'payment_status.required' => 'The payment status is required.',
            'payment_status.in' => 'The selected payment status is invalid.',
            'tracking_number.string' => 'The tracking number must be a string.',
            'tracking_number.max' => 'The tracking number may not be greater than 255 characters.',
            'notes.string' => 'The notes must be a string.',
            'notes.max' => 'The notes may not be greater than 1000 characters.',
            'items.array' => 'The items must be an array.',
            'items.*.id.required_with' => 'The item ID is required.',
            'items.*.id.integer' => 'The item ID must be an integer.',
            'items.*.id.exists' => 'The selected item ID is invalid.',
            'items.*.product_id.required_with' => 'The product ID is required for each item.',
            'items.*.product_id.integer' => 'The product ID for each item must be an integer.',
            'items.*.product_id.exists' => 'The selected product ID for an item is invalid.',
            'items.*.quantity.required_with' => 'The quantity is required for each item.',
            'items.*.quantity.integer' => 'The quantity for each item must be an integer.',
            'items.*.quantity.min' => 'The quantity for each item must be at least 1.',
            'items.*.unit_price.required_with' => 'The unit price is required for each item.',
            'items.*.unit_price.numeric' => 'The unit price for each item must be a number.',
            'items.*.unit_price.min' => 'The unit price for each item must be at least 0.',
            'items.*.total_price.required_with' => 'The total price is required for each item.',
            'items.*.total_price.numeric' => 'The total price for each item must be a number.',
            'items.*.total_price.min' => 'The total price for each item must be at least 0.',
            'items.*.product_variants.array' => 'The product variants for each item must be an array.',
        ];
    }
}

