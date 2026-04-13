<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class CustomerRequest extends FormRequest
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
        $storeId = getCurrentStoreId(Auth::user());
        $customerId = $this->route('customer'); // For update operations

        return [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('customers')->where(function ($query) use ($storeId, $customerId) {
                    $query->where('store_id', $storeId);
                    if ($customerId) {
                        $query->where('id', '!=', $customerId);
                    }
                }),
            ],
            'phone' => 'nullable|string|max:20',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other,prefer_not_to_say',
            'notes' => 'nullable|string',
            'avatar' => 'nullable|string',
            'is_active' => 'boolean',
            'preferred_language' => 'nullable|string|max:10',
            'customer_group' => 'nullable|string|max:50',
            'email_marketing' => 'boolean',
            'sms_notifications' => 'boolean',
            'order_updates' => 'boolean',
            'billing_address.address' => 'nullable|string',
            'billing_address.city' => 'nullable|string',
            'billing_address.state' => 'nullable|string',
            'billing_address.postal_code' => 'nullable|string',
            'billing_address.country' => 'nullable|string',
            'shipping_address.address' => 'nullable|string',
            'shipping_address.city' => 'nullable|string',
            'shipping_address.state' => 'nullable|string',
            'shipping_address.postal_code' => 'nullable|string',
            'shipping_address.country' => 'nullable|string',
            'same_as_billing' => 'boolean'
        ];
    }

    /**
     * Function: messages
     * @return array
     */
    public function messages(): array
    {
        return [
            'first_name.required' => 'Please enter the customer first name.',
            'last_name.required' => 'Please enter the customer last name.',
            'email.required' => 'Please enter the customer email address.',
            'email.email' => 'Please enter a valid email address.',
            'email.unique' => 'A customer with this email already exists for this store.',
            'gender.in' => 'The selected gender is invalid.',
        ];
    }
}

