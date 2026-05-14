<?php

namespace App\Http\Requests;

use App\Rules\LocalImageReference;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class BlogRequest extends FormRequest
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
        $blogId = $this->route('blog'); // For update operations
        $currentStoreId = getCurrentStoreId(Auth::user());

        return [
            'title' => 'required|string|max:255',
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('blogs')->ignore($blogId),
            ],
            'excerpt' => 'nullable|string',
            'content' => 'nullable|string',
            'featured_image' => ['nullable', 'string', new LocalImageReference()],
            'category_id' => [
                'nullable',
                Rule::exists('blog_categories', 'id')->where(fn ($query) => $query->where('store_id', $currentStoreId)),
            ],
            'status' => 'required|in:draft,published,scheduled',
            'published_at' => 'nullable|date',
            'is_featured' => 'boolean',
            'allow_comments' => 'boolean',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'focus_keyword' => 'nullable|string|max:255',
            'index_in_search' => 'boolean',
            'tags' => 'nullable|string'
        ];
    }
}
