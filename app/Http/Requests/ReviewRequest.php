<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class ReviewRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization will be handled in the controller using policies or gates
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'product_id' => 'required|exists:products,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
            'is_approved' => 'boolean',
            'reviewer_name' => 'nullable|string|max:255',
            'reviewer_email' => 'nullable|email|max:255',
        ];

        // If the user is authenticated, no need for reviewer_name and reviewer_email
        if (Auth::check()) {
            $rules['user_id'] = 'required|exists:users,id';
            unset($rules['reviewer_name']);
            unset($rules['reviewer_email']);
        }

        return $rules;
    }

    /**
     * Function: messages
     * @return array
     */
    public function messages(): array
    {
        return [
            'product_id.required' => 'A product is required for the review.',
            'product_id.exists' => 'The selected product does not exist.',
            'rating.required' => 'Please provide a rating.',
            'rating.integer' => 'The rating must be an integer.',
            'rating.min' => 'The rating must be at least 1.',
            'rating.max' => 'The rating may not be greater than 5.',
            'comment.max' => 'The comment may not be greater than 1000 characters.',
            'user_id.required' => 'A user ID is required for authenticated reviews.',
            'user_id.exists' => 'The selected user does not exist.',
            'reviewer_email.email' => 'Please enter a valid email address.',
        ];
    }
}

