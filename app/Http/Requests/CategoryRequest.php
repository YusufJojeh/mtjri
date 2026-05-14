<?php

namespace App\Http\Requests;

use App\Rules\LocalImageReference;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class CategoryRequest extends FormRequest
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
        $categoryId = $this->route('category') ?? $this->route('id');

        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image' => ['nullable', 'string', new LocalImageReference()],
            'parent_id' => [
                'nullable',
                Rule::exists('categories', 'id')->where(fn ($query) => $query->where('store_id', $storeId)),
            ],
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
            'slug' => [
                'nullable',
                'string',
                'max:255',
                function ($attribute, $value, $fail) use ($storeId, $categoryId) {
                    $query = \App\Models\Category::where('store_id', $storeId)->where('slug', $value);
                    if ($categoryId) {
                        $query->where('id', '!=', $categoryId);
                    }
                    if ($query->exists()) {
                        $fail('The slug must be unique for this store.');
                    }
                },
            ],
        ];
    }

    /**
     * Function: messages
     * @return array
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Please enter the category name.',
            'name.string' => 'The category name must be a string.',
            'name.max' => 'The category name may not be greater than 255 characters.',
            'description.string' => 'The category description must be a string.',
            'image.string' => 'The image must be a string.',
            'parent_id.exists' => 'The selected parent category does not exist.',
            'sort_order.integer' => 'The sort order must be an integer.',
            'is_active.boolean' => 'The active status must be a boolean.',
            'slug.unique' => 'The slug has already been taken.',
        ];
    }
}
