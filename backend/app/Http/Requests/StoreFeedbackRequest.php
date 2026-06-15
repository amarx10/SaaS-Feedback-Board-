<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFeedbackRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'       => ['required', 'string', 'max:200'],
            'description' => ['required', 'string', 'max:2000'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required'       => 'Please provide a title for your feedback.',
            'title.max'            => 'Title cannot exceed 200 characters.',
            'description.required' => 'Please describe your feedback in detail.',
            'description.max'      => 'Description cannot exceed 2000 characters.',
            'category_id.required' => 'Please select a category.',
            'category_id.exists'   => 'The selected category does not exist.',
        ];
    }
}